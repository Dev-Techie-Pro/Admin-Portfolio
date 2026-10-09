/**
 * Regression for audit C2: attribute-context XSS via escapeHtml (Appendix B).
 */
function escapeHtml(str) {
  const s = str == null ? '' : String(str);
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/`/g, '&#96;');
}

const payload = 'x" autofocus onfocus="window.__pwned=document.domain" y="';
const escaped = escapeHtml(payload);
const cells = `<td><input type="checkbox" aria-label="Select message from ${escaped}" /></td>`;

if (escaped.includes('"') || escaped.includes("'") || escaped.includes('`')) {
  console.error('FAIL: escapeHtml left quote characters (C2 attribute breakout).');
  process.exit(1);
}
if (/\sautofocus\s/.test(cells) && /onfocus\s*=\s*"/.test(cells)) {
  console.error('FAIL: escapeHtml allowed live event handler attribute (C2 PoC).');
  process.exit(1);
}

if (!escapeHtml('a & b <c>').includes('&amp;')) {
  console.error('FAIL: basic HTML escaping broken.');
  process.exit(1);
}

console.log('OK: escapeHtml attribute-context regression (C2).');
