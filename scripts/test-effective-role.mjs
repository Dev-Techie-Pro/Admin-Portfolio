import fs from 'node:fs';
import path from 'node:path';

const mig = path.join(process.cwd(), 'supabase/migrations/20261014120000_effective_role_and_cron.sql');
if (!fs.existsSync(mig)) {
  console.error('Missing effective_role migration');
  process.exit(1);
}
const sql = fs.readFileSync(mig, 'utf8');
const required = [
  /function public\.effective_role/i,
  /function public\.pa_revert_expired_elevations/i,
  /create or replace function public\.get_user_role/i,
];
for (const re of required) {
  if (!re.test(sql)) {
    console.error(`FAIL: migration missing ${re}`);
    process.exit(1);
  }
}
console.log('OK: effective_role migration patterns');
