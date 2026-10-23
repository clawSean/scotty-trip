import assert from 'node:assert/strict';
import { createApp } from '../server.mjs';

const server = createApp().listen(0, '127.0.0.1');
await new Promise((resolve) => server.once('listening', resolve));
try {
  const { port } = server.address();
  const page = await fetch(`http://127.0.0.1:${port}/`);
  assert.equal(page.status, 200);
  assert.match(await page.text(), /Desert Behavior/);
  const api = await fetch(`http://127.0.0.1:${port}/api/votes`);
  assert.equal(api.status, 200);
  console.log('Site and vote API smoke passed.');
} finally {
  server.close();
}

