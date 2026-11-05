import { test } from 'node:test';
import assert from 'node:assert/strict';
import { withHistory } from './history.js';

test('a shop that dies keeps its first death date and its last alive date', () => {
  const day1 = withHistory({ status: 'ok' }, undefined, '2026-01-01');
  const day2 = withHistory({ status: 'dead', reason: 'ENOTFOUND' }, day1, '2026-01-02');
  const day3 = withHistory({ status: 'dead', reason: 'ENOTFOUND' }, day2, '2026-01-03');
  assert.equal(day3.firstSeen, '2026-01-01');
  assert.equal(day3.lastAliveAt, '2026-01-01');
  assert.equal(day3.deadSince, '2026-01-02');
  assert.equal(day3.history.length, 2);
});

test('a revived shop clears deadSince and logs the change', () => {
  const dead = withHistory({ status: 'dead' }, { status: 'ok', firstSeen: '2025-01-01' }, '2026-01-01');
  const back = withHistory({ status: 'ok' }, dead, '2026-02-01');
  assert.equal(back.deadSince, null);
  assert.deepEqual(back.history.map((e) => e.status), ['dead', 'ok']);
});
