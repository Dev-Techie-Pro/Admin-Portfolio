import assert from 'node:assert/strict';

function isBlogPostPubliclyVisible(row, now = new Date()) {
  if (row.status === 'Draft') return false;
  const raw = row.published_at;
  if (!raw) return false;
  const t = new Date(raw).getTime();
  if (!Number.isFinite(t)) return false;
  return t <= now.getTime();
}

const past = new Date('2020-01-01T12:00:00Z');
const future = new Date('2099-01-01T12:00:00Z');

assert.equal(isBlogPostPubliclyVisible({ status: 'Published', published_at: '2019-06-01' }, past), true);
assert.equal(isBlogPostPubliclyVisible({ status: 'Scheduled', published_at: '2019-06-01' }, past), true);
assert.equal(isBlogPostPubliclyVisible({ status: 'Draft', published_at: '2019-06-01' }, past), false);
assert.equal(isBlogPostPubliclyVisible({ status: 'Published', published_at: '2099-06-01' }, past), false);
assert.equal(
  isBlogPostPubliclyVisible({ status: 'Published', published_at: future.toISOString() }, past),
  false,
);

console.log('OK: blog public visibility (M6).');
