import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { loadObservations } from '../lib/load-data.mjs';
import { parseCSV } from '../lib/data.mjs';

test('public atlas loads real snapshot without contacting a configured remote', async () => {
  const rows = parseCSV(await readFile(new URL('../public/data/places.csv', import.meta.url), 'utf8'));
  const result = await loadObservations({ loadSnapshot: async () => rows, loadRemote: () => { throw new Error('must not contact remote'); } });
  assert.equal(new Set(result.rows.map(row => row.county_fips)).size, 2956);
  assert.equal(rows.length, 23648);
  assert.ok(rows.every(row => !row.is_sample));
});

for (const scenario of ['unavailable', 'empty']) {
  test(`remote ${scenario} falls back to the real snapshot`, async () => {
    const result = await loadObservations({ preferRemote: true, loadSnapshot: async () => [{ county_fips: '37119' }], loadRemote: async () => { if (scenario === 'empty') return []; throw new Error('database unavailable'); } });
    assert.equal(result.source, 'Bundled CDC snapshot');
    assert.equal(result.rows[0].county_fips, '37119');
  });
}

test('snapshot failures stay visible rather than producing an empty success', async () => {
  await assert.rejects(loadObservations({ loadSnapshot: async () => [] }), /empty/);
});
