import fs from 'node:fs';
import { execSync } from 'node:child_process';

const files = execSync('git ls-files "app/**/bodyHtml.*" "app/**/*.html"', { encoding: 'utf8' })
  .trim()
  .split(/\n/)
  .filter(Boolean);

const swapPairs = [
  ['paGridViewBtn', 'paListViewBtn'],
  ['paCatGridViewBtn', 'paCatListViewBtn'],
  ['paBlogEngLikesGridViewBtn', 'paBlogEngLikesListViewBtn'],
];

function buildPatterns(gridId, listId) {
  return [
    new RegExp(
      `<button class="pa-view-btn active" id="${gridId}"([^>]*)><i class="ri-layout-grid-fill"></i></button>\\s*<button class="pa-view-btn" id="${listId}"([^>]*)><i class="ri-list-unordered"></i></button>`,
      'g',
    ),
    new RegExp(
      `<button class=\\\\"pa-view-btn active\\\\" id=\\\\"${gridId}\\\\"([^>]*)><i class=\\\\"ri-layout-grid-fill\\\\"></i></button>\\\\n\\s*<button class=\\\\"pa-view-btn\\\\" id=\\\\"${listId}\\\\"([^>]*)><i class=\\\\"ri-list-unordered\\\\"></i></button>`,
      'g',
    ),
  ];
}

function buildReplacements(gridId, listId, escaped = false) {
  if (!escaped) {
    return `<button class="pa-view-btn" id="${listId}"$2><i class="ri-list-unordered"></i></button><button class="pa-view-btn active" id="${gridId}"$1><i class="ri-layout-grid-fill"></i></button>`;
  }
  return `<button class=\\"pa-view-btn\\" id=\\"${listId}\\"$2><i class=\\"ri-list-unordered\\"></i></button>\\n          <button class=\\"pa-view-btn active\\" id=\\"${gridId}\\"$1><i class=\\"ri-layout-grid-fill\\"></i></button>`;
}

let count = 0;
for (const file of files) {
  const original = fs.readFileSync(file, 'utf8');
  let next = original;
  for (const [gridId, listId] of swapPairs) {
    const [plain, escaped] = buildPatterns(gridId, listId);
    next = next.replace(plain, buildReplacements(gridId, listId, false));
    next = next.replace(escaped, buildReplacements(gridId, listId, true));
  }
  if (next !== original) {
    fs.writeFileSync(file, next);
    count += 1;
    console.log('updated', file);
  }
}
console.log('files updated:', count);
