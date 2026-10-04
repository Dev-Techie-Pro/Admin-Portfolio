import fs from 'fs';
import path from 'path';

const files = [
  '../app/projects/bodyHtml.tsx',
  '../app/quickAddPanelHtml.tsx',
];

function patchHtml(h) {
  const pairs = [
    ['addTechInput', 'addTechSuggestList', 'addTechChips'],
    ['editTechInput', 'editTechSuggestList', 'editTechChips'],
    ['qaPrjTechInput', 'qaPrjTechSuggestList', 'qaPrjTechChips'],
  ];

  for (const [inputId, listId, chipsId] of pairs) {
    if (h.includes(listId)) continue;
    const wrapNeedle = `<div class=\\"pa-tech-input-wrap\\">`;
    const inputNeedle = `id=\\"${inputId}\\"`;
    const idx = h.indexOf(inputNeedle);
    if (idx < 0) continue;
    const wrapStart = h.lastIndexOf(wrapNeedle, idx);
    if (wrapStart < 0) continue;
    h = `${h.slice(0, wrapStart)}<div class=\\"pa-tech-suggest\\">${h.slice(wrapStart)}`;
    const chipsNeedle = `id=\\"${chipsId}\\"`;
    const chipsIdx = h.indexOf(chipsNeedle, wrapStart);
    if (chipsIdx < 0) continue;
    const chipsOpen = h.lastIndexOf('<div', chipsIdx);
    const insert = `<div class=\\"pa-tech-suggest-list\\" id=\\"${listId}\\" role=\\"listbox\\" hidden></div></div>\\n        `;
    h = `${h.slice(0, chipsOpen)}${insert}${h.slice(chipsOpen)}`;
  }
  return h;
}

for (const rel of files) {
  const file = new URL(rel, import.meta.url);
  let raw = fs.readFileSync(file, 'utf8');
  const isTsx = raw.includes('export const');
  const content = isTsx ? raw.replace(/^export const \w+ = "/, '').replace(/";\s*$/, '') : raw;
  const patched = patchHtml(content);
  const out = isTsx
    ? raw.replace(/"[\s\S]*"$/, `"${patched}";`)
    : patched;
  fs.writeFileSync(file, out);
  console.log('patched', path.basename(file.pathname));
}
