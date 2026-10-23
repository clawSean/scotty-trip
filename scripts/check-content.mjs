import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('../public/index.html', import.meta.url), 'utf8');
const js = await readFile(new URL('../public/app.js', import.meta.url), 'utf8');
for (const required of ['noindex', 'nov. 19–22', 'desert behavior', 'the babies can’t read this anyway']) {
  assert.ok(html.toLowerCase().includes(required), `Missing required content: ${required}`);
}
assert.ok(js.includes('/api/vote'), 'Voting API is not wired into the client.');
for (const forbidden of ['reservation number', 'pearson.jaredb@gmail.com', '6425 Reflection']) {
  assert.ok(!html.toLowerCase().includes(forbidden.toLowerCase()), `Public page contains forbidden phrase: ${forbidden}`);
}
console.log('Public content contract passed.');
