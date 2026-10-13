/**
 * Ensures general/other site settings merge helpers stay isolated (no cross-card DOM fields).
 * Run: node scripts/test-settings-card-merge.mjs
 */
import assert from 'node:assert/strict';

function mergeGeneralOnly(store, general) {
  return { ...store, ...general };
}

function mergeOtherOnly(store, other) {
  return { ...store, ...other };
}

const base = {
  siteTitle: 'A',
  itemsPerPage: '12',
  defaultView: 'grid',
  language: 'en',
  maintenanceMode: false,
};

const generalPatch = {
  siteTitle: 'B',
  siteTagline: 'Tag',
};

const otherPatch = {
  itemsPerPage: '24',
  defaultView: 'list',
};

const afterGeneral = mergeGeneralOnly(base, generalPatch);
assert.equal(afterGeneral.siteTitle, 'B');
assert.equal(afterGeneral.itemsPerPage, '12');
assert.equal(afterGeneral.defaultView, 'grid');

const afterOther = mergeOtherOnly(base, otherPatch);
assert.equal(afterOther.siteTitle, 'A');
assert.equal(afterOther.itemsPerPage, '24');
assert.equal(afterOther.defaultView, 'list');

console.log('test-settings-card-merge: ok');
