import fs from 'fs';
import path from 'path';

const root = path.resolve(import.meta.dirname, '..');

const files = [
  'app/inviteUserPanelHtml.tsx',
  'app/mediaPickerPanelHtml.tsx',
  'app/iconPickerPanelHtml.tsx',
  'app/project-technologies/bodyHtml.tsx',
  'app/staffInviteLinkModalHtml.tsx',
  'app/addUserPanelHtml.tsx',
];

function addNameFromId(html) {
  return html.replace(
    /(<input\b[^>]*\bid="([^"]+)"[^>]*)(?![^>]*\bname=)/g,
    (match, prefix, id) => {
      if (match.includes('name=')) return match;
      return `${prefix} name="${id}"`;
    },
  ).replace(
    /(<select\b[^>]*\bid="([^"]+)"[^>]*)(?![^>]*\bname=)/g,
    (match, prefix, id) => {
      if (match.includes('name=')) return match;
      return `${prefix} name="${id}"`;
    },
  );
}

function patchSocialLinkIds(html) {
  let i = 0;
  return html.replace(
    /<input class=\\"pa-form-input\\" type=\\"url\\"(?![^>]*\\bid=)/g,
    () => {
      const id = `profileSocialUrl${i}`;
      i += 1;
      return `<input class=\\"pa-form-input\\" type=\\"url\\" id=\\"${id}\\" name=\\"${id}\\"`;
    },
  );
}

for (const rel of files) {
  const file = path.join(root, rel);
  if (!fs.existsSync(file)) continue;
  let s = fs.readFileSync(file, 'utf8');
  const next = addNameFromId(s);
  if (next !== s) {
    fs.writeFileSync(file, next, 'utf8');
    console.log('updated', rel);
  }
}

const parts = path.join(root, 'app/settings/bodyHtmlParts.tsx');
let partsHtml = fs.readFileSync(parts, 'utf8');
const socialPatched = patchSocialLinkIds(partsHtml);
if (socialPatched !== partsHtml) {
  partsHtml = socialPatched;
  console.log('updated profile social link ids');
}

partsHtml = partsHtml.replace(
  '<label class=\\"pa-form-label\\">Social Links</label>',
  '<span class=\\"pa-form-label\\">Social Links</span>',
);
if (partsHtml !== fs.readFileSync(parts, 'utf8')) {
  fs.writeFileSync(parts, partsHtml, 'utf8');
  console.log('updated social links group label');
}
