import assert from 'node:assert/strict';
import { test } from 'node:test';
import { applyVote, choices, createApp, validateVote } from '../server.mjs';

test('vote schema rejects unknown categories and options', () => {
  assert.match(validateVote({ category: 'crime', option: 'yes', visitor: 'abcdefghijklmnop' }), /Unknown/);
  assert.match(validateVote({ category: 'dinner', option: 'gas-station', visitor: 'abcdefghijklmnop' }), /Unknown/);
  assert.equal(validateVote({ category: 'dinner', option: choices.dinner[0], visitor: 'abcdefghijklmnop' }), null);
});

test('one visitor moves rather than duplicates a category vote', () => {
  const state = { version: 1, updatedAt: null, votes: {}, visitors: {} };
  applyVote(state, { category: 'dinner', option: 'mission', visitor: 'abcdefghijklmnop' });
  applyVote(state, { category: 'dinner', option: 'dpov', visitor: 'abcdefghijklmnop' });
  assert.equal(state.votes.dinner.mission, 0);
  assert.equal(state.votes.dinner.dpov, 1);
});

test('server exposes health and blocks traversal', async (t) => {
  const server = createApp().listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  t.after(() => server.close());
  const { port } = server.address();
  const health = await fetch(`http://127.0.0.1:${port}/api/health`);
  assert.equal(health.status, 200);
  assert.deepEqual(await health.json(), { ok: true });
  const guide = await fetch(`http://127.0.0.1:${port}/guide.html`);
  assert.equal(guide.status, 200);
  assert.match(await guide.text(), /Field Guide — Desert Behavior/);
  const traversal = await fetch(`http://127.0.0.1:${port}/..%2Fpackage.json`);
  assert.equal(traversal.status, 404);
});
