import fs from 'fs/promises';
import path from 'path';

export const UNCHANGED_SECRET = '__UNCHANGED__';

/** @typedef {{ key: string; label: string; required?: boolean; secret?: boolean; type: string; hint?: string; options?: { value: string; label: string }[]; fullWidth?: boolean }} EnvFieldDef */

export const UI_ENV_DEFINITIONS = [
  { key: 'CRON_SECRET', label: 'CRON_SECRET', required: false, secret: true, type: 'text' },
  {
    key: 'SESSION_PRUNE_KEEP_DAYS',
    label: 'SESSION_PRUNE_KEEP_DAYS',
    required: false,
    secret: false,
    type: 'number',
    hint: 'Days to retain ended user_sessions (default 90).',
  },
  {
    key: 'LOGIN_ACTIVITY_RETENTION_DAYS',
    label: 'LOGIN_ACTIVITY_RETENTION_DAYS',
    required: false,
    secret: false,
    type: 'number',
    hint: 'Login activity retention for Settings → Security (default 90).',
  },
  {
    key: 'LOGIN_ACTIVITY_PER_USER_CAP',
    label: 'LOGIN_ACTIVITY_PER_USER_CAP',
    required: false,
    secret: false,
    type: 'number',
    hint: 'Max login_activity rows per user (default 100).',
  },
  {
    key: 'CMS_BATCH_WRITES',
    label: 'CMS_BATCH_WRITES',
    required: false,
    secret: false,
    type: 'select',
    hint: 'Batch CMS writes (default on). Set to false to disable.',
    options: [
      { value: '', label: 'Default (batch writes on)' },
      { value: 'false', label: 'false — disable batch writes' },
    ],
  },
  {
    key: 'MEDIA_FULL_RECONCILE',
    label: 'MEDIA_FULL_RECONCILE',
    required: false,
    secret: false,
    type: 'select',
    hint: 'Full media library reconcile (default scoped).',
    options: [
      { value: '', label: 'Default (scoped reconcile)' },
      { value: 'true', label: 'true — full reconcile' },
    ],
  },
  { key: 'SMTP_HOST', label: 'SMTP_HOST', required: false, secret: false, type: 'text' },
  { key: 'SMTP_PORT', label: 'SMTP_PORT', required: false, secret: false, type: 'number' },
  { key: 'SMTP_USER', label: 'SMTP_USER', required: false, secret: false, type: 'email' },
  { key: 'SMTP_PASS', label: 'SMTP_PASS', required: false, secret: true, type: 'password' },
  { key: 'SMTP_FROM', label: 'SMTP_FROM', required: false, secret: false, type: 'email' },
  { key: 'EMAIL_BRAND_NAME', label: 'EMAIL_BRAND_NAME', required: false, secret: false, type: 'text' },
  { key: 'EMAIL_BRAND_ROLE', label: 'EMAIL_BRAND_ROLE', required: false, secret: false, type: 'text' },
  { key: 'EMAIL_PORTFOLIO_LABEL', label: 'EMAIL_PORTFOLIO_LABEL', required: false, secret: false, type: 'text' },
  { key: 'EMAIL_PORTFOLIO_URL', label: 'EMAIL_PORTFOLIO_URL', required: false, secret: false, type: 'url' },
  { key: 'EMAIL_GITHUB_URL', label: 'EMAIL_GITHUB_URL', required: false, secret: false, type: 'url' },
  { key: 'EMAIL_LINKEDIN_URL', label: 'EMAIL_LINKEDIN_URL', required: false, secret: false, type: 'url' },
];

export const UI_ENV_GROUPS = [
  {
    id: 'security',
    title: 'Security & Cron',
    icon: 'ri-shield-keyhole-line',
    description: 'Cron protection, session pruning, and login activity retention.',
    column: 'left',
    keys: [
      'CRON_SECRET',
      'SESSION_PRUNE_KEEP_DAYS',
      'LOGIN_ACTIVITY_RETENTION_DAYS',
      'LOGIN_ACTIVITY_PER_USER_CAP',
    ],
  },
  {
    id: 'performance',
    title: 'Performance',
    icon: 'ri-speed-line',
    description: 'Optional rollbacks for batch writes and media sync behavior.',
    column: 'left',
    keys: ['CMS_BATCH_WRITES', 'MEDIA_FULL_RECONCILE'],
  },
  {
    id: 'smtp',
    title: 'SMTP Email',
    icon: 'ri-mail-settings-line',
    description: 'Outgoing mail for contact replies and credential emails.',
    column: 'right',
    keys: ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'SMTP_FROM'],
  },
  {
    id: 'branding',
    title: 'Email Branding',
    icon: 'ri-palette-line',
    description: 'Optional branding shown in automated reply emails.',
    column: 'right',
    keys: [
      'EMAIL_BRAND_NAME',
      'EMAIL_BRAND_ROLE',
      'EMAIL_PORTFOLIO_LABEL',
      'EMAIL_PORTFOLIO_URL',
      'EMAIL_GITHUB_URL',
      'EMAIL_LINKEDIN_URL',
    ],
  },
];

const DEF_BY_KEY = new Map(UI_ENV_DEFINITIONS.map((def) => [def.key, def]));
export const UI_ENV_KEYS = UI_ENV_DEFINITIONS.map((item) => item.key);
const SECRET_KEYS = new Set(UI_ENV_DEFINITIONS.filter((item) => item.secret).map((item) => item.key));

export function getEnvFieldDefinition(key) {
  return DEF_BY_KEY.get(key);
}

function localEnvPath() {
  return path.join(process.cwd(), '.env.local');
}

function exampleEnvPath() {
  return path.join(process.cwd(), '.env.example');
}

function baseEnvPath() {
  return path.join(process.cwd(), '.env');
}

export function maskSecretValue(value) {
  if (!value) return '';
  const text = String(value);
  if (text.length <= 8) return '••••••••';
  return `${text.slice(0, 4)}${'•'.repeat(Math.min(12, text.length - 8))}${text.slice(-4)}`;
}

export function parseEnvFile(content) {
  const vars = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"'))
      || (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    vars[key] = value;
  }
  return vars;
}

async function readEnvSource() {
  for (const filePath of [localEnvPath(), baseEnvPath(), exampleEnvPath()]) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      return { content, filePath };
    } catch {
      /* try next */
    }
  }
  return { content: '', filePath: localEnvPath() };
}

export async function canWriteEnvFile() {
  try {
    await fs.access(process.cwd(), fs.constants.W_OK);
    return true;
  } catch {
    return false;
  }
}

export async function getEnvConfig() {
  const { content, filePath } = await readEnvSource();
  const parsed = parseEnvFile(content);
  const values = {};
  const masked = {};
  const configured = {};

  for (const key of UI_ENV_KEYS) {
    const resolved = parsed[key] ?? process.env[key] ?? '';
    values[key] = resolved;
    configured[key] = Boolean(resolved);
    masked[key] = SECRET_KEYS.has(key) && resolved ? maskSecretValue(resolved) : resolved;
  }

  return {
    values: masked,
    configured,
    source: path.basename(filePath),
    writable: await canWriteEnvFile(),
    targetFile: '.env.local',
    groups: UI_ENV_GROUPS,
    definitions: UI_ENV_DEFINITIONS,
  };
}

function serializeValue(value) {
  const text = String(value ?? '');
  if (!text) return '';
  if (/[\s#"'=]/.test(text)) return `"${text.replace(/"/g, '\\"')}"`;
  return text;
}

function isValidUrl(value) {
  try {
    const parsed = new URL(value);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function validatePositiveInt(value, label, { min = 1, max = 36500 } = {}) {
  const num = Number.parseInt(String(value).trim(), 10);
  if (!Number.isInteger(num) || num < min || num > max) {
    return `${label} must be an integer between ${min} and ${max}.`;
  }
  return null;
}

export function validateEnvUpdates(updates = {}) {
  const errors = [];

  for (const def of UI_ENV_DEFINITIONS) {
    const value = updates[def.key];
    if (value === UNCHANGED_SECRET || value === undefined) continue;
    const trimmed = String(value).trim();

    if (def.required && !trimmed) {
      errors.push(`${def.label} is required.`);
      continue;
    }
    if (!trimmed) continue;

    if (def.type === 'url' && !isValidUrl(trimmed)) {
      errors.push(`${def.label} must be a valid URL.`);
    }
    if (def.type === 'email' && !isValidEmail(trimmed)) {
      errors.push(`${def.label} must be a valid email address.`);
    }
    if (def.type === 'number') {
      const port = Number(trimmed);
      if (def.key === 'SMTP_PORT') {
        if (!Number.isInteger(port) || port < 1 || port > 65535) {
          errors.push(`${def.label} must be a number between 1 and 65535.`);
        }
      } else {
        const err = validatePositiveInt(trimmed, def.label);
        if (err) errors.push(err);
      }
    }
    if (def.type === 'select' && def.options?.length) {
      const allowed = new Set(def.options.map((o) => o.value));
      if (!allowed.has(trimmed)) {
        errors.push(`${def.label} has an invalid value.`);
      }
    }
  }

  const smtpFields = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS'];
  const smtpProvided = smtpFields.some((key) => {
    const value = updates[key];
    return value && value !== UNCHANGED_SECRET && String(value).trim();
  });
  if (smtpProvided) {
    for (const key of ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS']) {
      const value = updates[key];
      if (value === UNCHANGED_SECRET) continue;
      if (!String(value || '').trim()) {
        errors.push('When configuring SMTP, host, user, and password are required.');
        break;
      }
    }
  }

  return errors;
}

export async function saveEnvConfig(updates = {}) {
  const errors = validateEnvUpdates(updates);
  if (errors.length) {
    const err = new Error(errors[0]);
    err.validationErrors = errors;
    throw err;
  }

  const { content } = await readEnvSource();
  const parsed = parseEnvFile(content);
  const merged = { ...parsed };

  for (const key of UI_ENV_KEYS) {
    const value = updates[key];
    if (value === undefined || value === UNCHANGED_SECRET) continue;
    merged[key] = String(value).trim();
  }

  const handled = new Set();
  const lines = content ? content.split('\n') : [];
  const nextLines = lines.map((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return line;
    const eq = trimmed.indexOf('=');
    if (eq === -1) return line;
    const key = trimmed.slice(0, eq).trim();
    if (!UI_ENV_KEYS.includes(key)) return line;
    handled.add(key);
    return `${key}=${serializeValue(merged[key] ?? '')}`;
  });

  for (const key of UI_ENV_KEYS) {
    if (handled.has(key)) continue;
    if (merged[key] == null || merged[key] === '') continue;
    nextLines.push(`${key}=${serializeValue(merged[key])}`);
  }

  const output = nextLines.join('\n').replace(/\n+$/, '') + '\n';
  await fs.writeFile(localEnvPath(), output, 'utf8');
  return { ok: true, file: '.env.local' };
}
