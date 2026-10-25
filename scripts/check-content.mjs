import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('../public/index.html', import.meta.url), 'utf8');
const guide = await readFile(new URL('../public/guide.html', import.meta.url), 'utf8');
const js = await readFile(new URL('../public/app.js', import.meta.url), 'utf8');
for (const required of ['noindex', 'nov. 19–22', 'desert behavior', 'the valley has been warned']) {
  assert.ok(html.toLowerCase().includes(required), `Missing required content: ${required}`);
}
assert.ok(js.includes('/api/vote'), 'Voting API is not wired into the client.');
assert.ok(html.includes('href="/guide.html"'), 'Main navigation does not link to the field guide.');
assert.ok(html.includes('class="round-link vote-jump" href="#vote"'), 'Hero CTA does not jump to voting.');
for (const required of ['trail 100', 'the mission', 'social tap', 'package access is not a reservation']) {
  assert.ok(guide.toLowerCase().includes(required), `Field guide is missing required content: ${required}`);
}
for (const forbidden of ['reservation number', 'pearson.jaredb@gmail.com', '6425 Reflection', 'the babies can’t read this anyway', 'the desert has been warned', 'countdown-label']) {
  assert.ok(!html.toLowerCase().includes(forbidden.toLowerCase()), `Public page contains forbidden phrase: ${forbidden}`);
  assert.ok(!guide.toLowerCase().includes(forbidden.toLowerCase()), `Field guide contains forbidden phrase: ${forbidden}`);
}
console.log('Public content contract passed.');
