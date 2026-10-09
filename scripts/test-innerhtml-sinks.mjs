/**
 * Heuristic audit (M3): flag innerHTML templates that embed object fields without escapeHtml.
 */
import fs from 'node:fs';
import path from 'node:path';

const clientRoot = path.join(process.cwd(), 'client');

const USER_PROP_RE = /\$\{[^}]*\.(name|email|body|message|subject|snippet|title|authorName|quote|description|label|slug|ip)\b/i;

function walk(dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, acc);
    else if (entry.name.endsWith('.ts')) acc.push(full);
  }
  return acc;
}

function blockLooksUnsafe(block) {
  if (block.includes('escapeHtml(')) return false;
  return USER_PROP_RE.test(block);
}

const suspects = [];
for (const file of walk(clientRoot)) {
  const rel = path.relative(process.cwd(), file);
  const text = fs.readFileSync(file, 'utf8');
  const re = /innerHTML\s*=\s*`([^`]*(?:\$\{[^}]+\}[^`]*)*)`/g;
  let match;
  while ((match = re.exec(text)) !== null) {
    const template = match[1] || '';
    const blocks = template.match(/\$\{[^}]+\}/g) || [];
    if (!blocks.some(blockLooksUnsafe)) continue;
    suspects.push(`${rel}:${text.slice(0, match.index).split('\n').length}`);
  }
}

if (suspects.length) {
  console.error('Possible unescaped user-content innerHTML sinks:\n', suspects.join('\n'));
  process.exit(1);
}

console.log('OK: innerHTML user-content sink heuristic (client).');
