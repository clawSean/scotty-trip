import { createHash, randomBytes } from 'node:crypto';
import { createReadStream, existsSync } from 'node:fs';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { dirname, extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const publicRoot = resolve(here, 'public');
const dataFile = resolve(process.env.DATA_FILE || join(here, 'data', 'votes.json'));
const salt = process.env.VOTE_SALT || 'scotty-public-v1';

export const choices = Object.freeze({
  dinner: ['mission', 'dpov', 'citizen', 'olive'],
  daytime: ['papago', 'taliesin', 'balloon', 'topgolf'],
  nightlife: ['rooftop', 'partybike', 'socialtap', 'whiskey'],
  energy: ['pool', 'nature', 'chaos']
});

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const securityHeaders = {
  'Content-Security-Policy': "default-src 'self'; img-src 'self' data:; style-src 'self'; script-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'self'",
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'SAMEORIGIN',
  'X-Robots-Tag': 'noindex, nofollow, noarchive',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
};

let stateQueue = Promise.resolve();
const rate = new Map();

function blankState() {
  return { version: 1, updatedAt: null, votes: {}, visitors: {} };
}

async function loadState() {
  try {
    const parsed = JSON.parse(await readFile(dataFile, 'utf8'));
    return parsed?.version === 1 ? parsed : blankState();
  } catch (error) {
    if (error.code === 'ENOENT') return blankState();
    throw error;
  }
}

async function saveState(state) {
  await mkdir(dirname(dataFile), { recursive: true });
  const temp = `${dataFile}.${process.pid}.${randomBytes(4).toString('hex')}.tmp`;
  await writeFile(temp, `${JSON.stringify(state, null, 2)}\n`, { mode: 0o600 });
  await rename(temp, dataFile);
}

function publicTotals(state) {
  const result = {};
  for (const [category, options] of Object.entries(choices)) {
    result[category] = Object.fromEntries(options.map((option) => [option, state.votes?.[category]?.[option] || 0]));
  }
  return result;
}

function hashVisitor(visitor) {
  return createHash('sha256').update(`${salt}:${visitor}`).digest('hex');
}

export function validateVote(payload) {
  if (!payload || typeof payload !== 'object') return 'Invalid vote payload.';
  if (!Object.hasOwn(choices, payload.category)) return 'Unknown vote category.';
  if (!choices[payload.category].includes(payload.option)) return 'Unknown vote option.';
  if (typeof payload.visitor !== 'string' || !/^[a-zA-Z0-9_-]{16,80}$/.test(payload.visitor)) return 'Invalid visitor token.';
  return null;
}

export function applyVote(state, payload) {
  const visitor = hashVisitor(payload.visitor);
  state.votes[payload.category] ||= {};
  state.visitors[visitor] ||= {};
  const previous = state.visitors[visitor][payload.category];
  if (previous && previous !== payload.option) {
    state.votes[payload.category][previous] = Math.max(0, (state.votes[payload.category][previous] || 0) - 1);
  }
  if (previous !== payload.option) {
    state.votes[payload.category][payload.option] = (state.votes[payload.category][payload.option] || 0) + 1;
    state.visitors[visitor][payload.category] = payload.option;
  }
  state.updatedAt = new Date().toISOString();
  return state;
}

function json(res, status, body) {
  res.writeHead(status, { ...securityHeaders, 'Content-Type': mime['.json'], 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(body));
}

function allowRequest(req) {
  const ip = req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const bucket = rate.get(ip) || { since: now, count: 0 };
  if (now - bucket.since > 60_000) {
    bucket.since = now;
    bucket.count = 0;
  }
  bucket.count += 1;
  rate.set(ip, bucket);
  return bucket.count <= 90;
}

async function readJson(req) {
  let body = '';
  for await (const chunk of req) {
    body += chunk;
    if (body.length > 4096) throw new Error('BODY_TOO_LARGE');
  }
  return JSON.parse(body || '{}');
}

async function api(req, res, pathname) {
  if (pathname === '/api/health' && req.method === 'GET') return json(res, 200, { ok: true });
  if (pathname === '/api/votes' && req.method === 'GET') {
    const state = await loadState();
    return json(res, 200, { votes: publicTotals(state), updatedAt: state.updatedAt });
  }
  if (pathname === '/api/vote' && req.method === 'POST') {
    if (!allowRequest(req)) return json(res, 429, { error: 'Easy, cowboy. Try again in a minute.' });
    try {
      const payload = await readJson(req);
      const error = validateVote(payload);
      if (error) return json(res, 400, { error });
      const result = await (stateQueue = stateQueue.then(async () => {
        const state = applyVote(await loadState(), payload);
        await saveState(state);
        return { votes: publicTotals(state), selected: payload.option };
      }));
      return json(res, 200, result);
    } catch (error) {
      const status = error.message === 'BODY_TOO_LARGE' ? 413 : 400;
      return json(res, status, { error: 'That vote arrived wearing a fake moustache.' });
    }
  }
  return json(res, 404, { error: 'Not found.' });
}

function staticFile(req, res, pathname) {
  const relative = pathname === '/' ? 'index.html' : decodeURIComponent(pathname).replace(/^\/+/, '');
  const file = resolve(publicRoot, normalize(relative));
  if (!file.startsWith(`${publicRoot}/`) || !existsSync(file)) {
    res.writeHead(404, { ...securityHeaders, 'Content-Type': mime['.html'] });
    return res.end('<!doctype html><title>Lost in the desert</title><h1>Wrong cactus.</h1>');
  }
  const cache = /\/assets\//.test(pathname) ? 'public, max-age=604800' : 'no-cache';
  res.writeHead(200, { ...securityHeaders, 'Content-Type': mime[extname(file)] || 'application/octet-stream', 'Cache-Control': cache });
  if (req.method === 'HEAD') return res.end();
  createReadStream(file).pipe(res);
}

export function createApp() {
  return createServer(async (req, res) => {
    try {
      const url = new URL(req.url, 'http://localhost');
      if (url.pathname.startsWith('/api/')) return await api(req, res, url.pathname);
      if (!['GET', 'HEAD'].includes(req.method)) return json(res, 405, { error: 'Method not allowed.' });
      return staticFile(req, res, url.pathname);
    } catch {
      return json(res, 500, { error: 'The desert ate that request.' });
    }
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT || 4177);
  createApp().listen(port, '127.0.0.1', () => console.log(`Scotty is causing problems on http://127.0.0.1:${port}`));
}

