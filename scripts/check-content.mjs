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
assert.ok(html.includes('class="round-link explore-jump" href="#itinerary"'), 'Hero CTA does not open the trip exploration flow.');
for (const required of ['lookout mountain summit', 'dreamy draw nature trail', 'camelback via cholla', 'shaw butte trail 306', 'camelback via echo canyon', 'trail 100', 'route from resort', 'terrace room', 'granada park', 'the mission', 'richardson’s', 'buck &amp; rider', 'the beverly on main', 'platform 18', 'social tap', 'package access is not a reservation']) {
  assert.ok(guide.toLowerCase().includes(required), `Field guide is missing required content: ${required}`);
}
for (const forbidden of ['reservation number', 'pearson.jaredb@gmail.com', '6425 Reflection', 'the babies can’t read this anyway', 'the desert has been warned', 'countdown-label']) {
  assert.ok(!html.toLowerCase().includes(forbidden.toLowerCase()), `Public page contains forbidden phrase: ${forbidden}`);
  assert.ok(!guide.toLowerCase().includes(forbidden.toLowerCase()), `Field guide contains forbidden phrase: ${forbidden}`);
}
console.log('Public content contract passed.');
