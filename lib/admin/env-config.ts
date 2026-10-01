export const UNCHANGED_SECRET = '__UNCHANGED__';

/**
 * @typedef {{
 *   key: string;
 *   label: string;
 *   required?: boolean;
 *   secret?: boolean;
 *   type: string;
 *   hint?: string;
 *   description?: string;
 *   details?: string[];
 *   defaultValue?: string;
 *   placeholder?: string;
 *   options?: { value: string; label: string }[];
 *   fullWidth?: boolean;
 * }} EnvFieldDef
 */

/** Host / deploy only — not stored in site_runtime_config or the Environment UI. */
export const DEPLOYMENT_ENV_KEYS = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'NEXT_PUBLIC_SITE_URL',
  'CRON_SECRET',
  'PORTFOLIO_PUBLIC_ORIGINS',
];

export const UI_ENV_DEFINITIONS = [
  {
    key: 'SESSION_PRUNE_KEEP_DAYS',
    label: 'Session history retention',
    required: false,
    secret: false,
    type: 'number',
    fullWidth: true,
    placeholder: '90',
    description:
      'How many days to keep ended rows in the <code>user_sessions</code> table before the prune cron deletes them.',
    details: [
      'Only affects sessions that have already ended (logout or expiry), not active logins.',
      'Pruning runs via the prune-sessions cron job when <code>CRON_SECRET</code> is configured.',
      'Lower values reduce database size; higher values keep a longer audit trail.',
    ],
    defaultValue: '90 days',
  },
  {
    key: 'LOGIN_ACTIVITY_RETENTION_DAYS',
    label: 'Login activity retention',
    required: false,
    secret: false,
    type: 'number',
    fullWidth: true,
    placeholder: '90',
    description:
      'Maximum age of rows shown under Settings → Security → Login activity and stored in <code>login_activity</code>.',
    details: [
      'Older events are removed during session prune / retention maintenance.',
      'Works together with <code>LOGIN_ACTIVITY_PER_USER_CAP</code> (whichever limit applies first).',
      'Does not disable logging — only controls how long history is kept.',
    ],
    defaultValue: '90 days',
  },
  {
    key: 'LOGIN_ACTIVITY_PER_USER_CAP',
    label: 'Login activity per-user cap',
    required: false,
    secret: false,
    type: 'number',
    fullWidth: true,
    placeholder: '100',
    description:
      'Maximum number of <code>login_activity</code> rows stored per user account.',
    details: [
      'When a user exceeds this count, oldest entries are deleted first.',
      'Prevents unbounded growth for accounts with frequent sign-ins.',
      'Security UI lists the most recent events within this cap and the retention window.',
    ],
    defaultValue: '100 rows per user',
  },
  {
    key: 'RATE_LIMIT_AUTH_LOGIN_MAX',
    label: 'Login rate limit (max attempts)',
    required: false,
    secret: false,
    type: 'number',
    placeholder: '20',
    description: 'Maximum failed login attempts per IP per window (applies to <code>/api/auth/login</code>).',
    defaultValue: '20',
  },
  {
    key: 'RATE_LIMIT_AUTH_LOGIN_WINDOW_SEC',
    label: 'Login rate limit window (seconds)',
    required: false,
    secret: false,
    type: 'number',
    placeholder: '900',
    description: 'Time window for login rate limiting (default 15 minutes).',
    defaultValue: '900',
  },
  {
    key: 'RATE_LIMIT_PUBLIC_CONTACT_MAX',
    label: 'Contact form rate limit (max submissions)',
    required: false,
    secret: false,
    type: 'number',
    placeholder: '5',
    description: 'Max contact form posts per IP per hour via <code>/api/public/contact</code>.',
    defaultValue: '5',
  },
  {
    key: 'RATE_LIMIT_PUBLIC_CONTACT_WINDOW_SEC',
    label: 'Contact form rate window (seconds)',
    required: false,
    secret: false,
    type: 'number',
    placeholder: '3600',
    defaultValue: '3600',
  },
  {
    key: 'ANALYTICS_PROVIDER',
    label: 'Analytics provider',
    required: false,
    secret: false,
    type: 'select',
    description: 'Identifier exposed to the portfolio site via public config (optional).',
    options: [
      { value: '', label: 'None' },
      { value: 'plausible', label: 'Plausible' },
      { value: 'ga4', label: 'Google Analytics 4' },
      { value: 'umami', label: 'Umami' },
    ],
    defaultValue: 'None',
  },
  {
    key: 'ANALYTICS_SITE_ID',
    label: 'Analytics site / measurement ID',
    required: false,
    secret: false,
    type: 'text',
    placeholder: 'example.com or G-XXXXXXXX',
    description: 'Domain or measurement ID for the selected analytics provider.',
  },
  {
    key: 'WEBHOOK_PUBLISH_URL',
    label: 'Publish webhook URL',
    required: false,
    secret: false,
    type: 'url',
    fullWidth: true,
    placeholder: 'https://hooks.slack.com/...',
    description: 'Optional HTTPS endpoint notified when blog posts are published (JSON POST).',
  },
  {
    key: 'CMS_BATCH_WRITES',
    label: 'CMS batch writes',
    required: false,
    secret: false,
    type: 'select',
    fullWidth: true,
    description:
      'Controls whether the CMS batches multiple write operations into fewer database round-trips.',
    details: [
      'Default (empty): batching is <strong>on</strong> — recommended for normal use.',
      'Set to <code>false</code> only when debugging write ordering issues or isolating a failing save path.',
      'Disabling may increase latency on bulk edits (projects, media metadata, etc.).',
    ],
    defaultValue: 'Batch writes enabled',
    options: [
      { value: '', label: 'Default — batch writes on' },
      { value: 'false', label: 'false — disable batch writes (debug)' },
    ],
  },
  {
    key: 'MEDIA_FULL_RECONCILE',
    label: 'Media library reconcile mode',
    required: false,
    secret: false,
    type: 'select',
    fullWidth: true,
    description:
      'How aggressively the media sync reconciles storage files with <code>media_assets</code> records.',
    details: [
      'Default (empty): <strong>scoped</strong> reconcile — faster, limits work to relevant folders/operations.',
      'Set to <code>true</code> for a full-library scan (useful after storage migrations or fixing orphans).',
      'Full reconcile can be slow on large libraries; run during low traffic.',
    ],
    defaultValue: 'Scoped reconcile',
    options: [
      { value: '', label: 'Default — scoped reconcile' },
      { value: 'true', label: 'true — full library reconcile' },
    ],
  },
  {
    key: 'SMTP_HOST',
    label: 'SMTP host',
    required: false,
    secret: false,
    type: 'text',
    fullWidth: true,
    placeholder: 'smtp.gmail.com',
    description: 'Hostname of your outgoing mail server (SMTP relay).',
    details: [
      'Required together with user, password, and from address to send mail from the dashboard.',
      'Gmail / Google Workspace: use <code>smtp.gmail.com</code> with an app password if 2FA is enabled.',
      'Other providers: use the SMTP hostname from their documentation (SendGrid, Mailgun, etc.).',
    ],
    defaultValue: 'smtp.gmail.com when using Gmail defaults in code',
  },
  {
    key: 'SMTP_PORT',
    label: 'SMTP port',
    required: false,
    secret: false,
    type: 'number',
    fullWidth: true,
    placeholder: '587',
    description: 'TCP port for SMTP. Must match your provider (TLS/STARTTLS vs SSL).',
    details: [
      '<code>587</code> — STARTTLS (common for Gmail and most providers).',
      '<code>465</code> — implicit SSL (some hosts require this instead).',
      'Invalid ports are rejected on save (1–65535).',
    ],
    defaultValue: '587',
  },
  {
    key: 'SMTP_USER',
    label: 'SMTP username',
    required: false,
    secret: false,
    type: 'email',
    fullWidth: true,
    placeholder: 'you@example.com',
    description: 'Account username for SMTP authentication (usually your mailbox email).',
    details: [
      'Must match credentials your provider expects (often the same as <code>SMTP_FROM</code>).',
      'For Gmail, this is your full Google account email.',
    ],
  },
  {
    key: 'SMTP_PASS',
    label: 'SMTP password',
    required: false,
    secret: true,
    type: 'password',
    fullWidth: true,
    description: 'SMTP password or app-specific password. Never commit this to git.',
    details: [
      'Gmail: create an <strong>App Password</strong> (Google Account → Security → 2-Step Verification → App passwords).',
      'Leave blank when saving to keep the current password unchanged.',
      'If any SMTP field is set, host, user, and password are required to send mail.',
    ],
  },
  {
    key: 'SMTP_FROM',
    label: 'From address',
    required: false,
    secret: false,
    type: 'email',
    fullWidth: true,
    placeholder: 'you@example.com',
    description: 'Sender email address recipients see on outbound messages.',
    details: [
      'Used for contact message replies from the inbox and new-user credential emails.',
      'Many providers require this to match <code>SMTP_USER</code> or a verified sender domain.',
    ],
  },
  {
    key: 'EMAIL_BRAND_NAME',
    label: 'Brand name',
    required: false,
    secret: false,
    type: 'text',
    fullWidth: true,
    placeholder: 'Your Name',
    description: 'Display name in the header/footer of automated HTML emails.',
    details: [
      'Shown in credential emails and contact reply templates.',
      'Purely cosmetic — does not change SMTP delivery.',
    ],
  },
  {
    key: 'EMAIL_BRAND_ROLE',
    label: 'Brand role / title',
    required: false,
    secret: false,
    type: 'text',
    fullWidth: true,
    placeholder: 'Full Stack Developer',
    description: 'Short subtitle under your name in email branding (job title or tagline).',
  },
  {
    key: 'EMAIL_PORTFOLIO_LABEL',
    label: 'Portfolio link label',
    required: false,
    secret: false,
    type: 'text',
    fullWidth: true,
    placeholder: 'Portfolio Dashboard',
    description: 'Text for the main portfolio / site link in email footers.',
    details: [
      'Pairs with <code>EMAIL_PORTFOLIO_URL</code>.',
      'Falls back to “Portfolio Dashboard” in code when empty.',
    ],
    defaultValue: 'Portfolio Dashboard',
  },
  {
    key: 'EMAIL_PORTFOLIO_URL',
    label: 'Portfolio link URL',
    required: false,
    secret: false,
    type: 'url',
    fullWidth: true,
    placeholder: 'https://yoursite.com',
    description: 'HTTPS URL opened when recipients click the portfolio link in emails.',
    details: [
      'Use your public portfolio or marketing site, not necessarily this admin URL.',
      'Must be a valid <code>https://</code> (or <code>http://</code>) URL when set.',
    ],
  },
  {
    key: 'EMAIL_GITHUB_URL',
    label: 'GitHub profile URL',
    required: false,
    secret: false,
    type: 'url',
    fullWidth: true,
    placeholder: 'https://github.com/username',
    description: 'Optional GitHub link rendered in email footers.',
  },
  {
    key: 'EMAIL_LINKEDIN_URL',
    label: 'LinkedIn profile URL',
    required: false,
    secret: false,
    type: 'url',
    fullWidth: true,
    placeholder: 'https://www.linkedin.com/in/username',
    description: 'Optional LinkedIn link rendered in email footers.',
  },
  {
    key: 'TURNSTILE_SITE_KEY',
    label: 'Turnstile site key (public)',
    required: false,
    secret: false,
    type: 'text',
    fullWidth: true,
    description: 'Cloudflare Turnstile site key exposed via <code>/api/public/config</code> for portfolio forms.',
  },
  {
    key: 'TURNSTILE_SECRET_KEY',
    label: 'Turnstile secret key',
    required: false,
    secret: true,
    type: 'text',
    fullWidth: true,
    description: 'When set, <code>/api/public/contact</code> and blog comment POST require a valid Turnstile token.',
  },
  {
    key: 'CONTACT_AUTO_REPLY_ENABLED',
    label: 'Contact auto-reply',
    required: false,
    secret: false,
    type: 'select',
    options: [
      { value: '', label: 'Disabled' },
      { value: 'true', label: 'Enabled — send SMTP acknowledgement' },
    ],
    description: 'Automatically email visitors after a successful <code>/api/public/contact</code> submission.',
  },
  {
    key: 'CONTACT_AUTO_REPLY_SUBJECT',
    label: 'Auto-reply subject',
    required: false,
    secret: false,
    type: 'text',
    fullWidth: true,
    placeholder: 'We received your message',
    description: 'Supports <code>{{name}}</code>, <code>{{subject}}</code>, <code>{{brand}}</code>.',
  },
  {
    key: 'CONTACT_AUTO_REPLY_BODY',
    label: 'Auto-reply body',
    required: false,
    secret: false,
    type: 'text',
    fullWidth: true,
    placeholder: 'Hi {{name}}, thank you for your message...',
    description: 'Plain text body; same template variables as subject.',
  },
  {
    key: 'REQUIRE_MFA_ADMINS',
    label: 'Require MFA for admins',
    required: false,
    secret: false,
    type: 'select',
    options: [
      { value: '', label: 'Optional (default)' },
      { value: 'true', label: 'true — block admin/super_admin without enrolled TOTP' },
    ],
    description: 'When enabled, admin roles must enroll MFA before using the dashboard.',
  },
  {
    key: 'REDIRECTS_JSON',
    label: 'Path redirects (JSON)',
    required: false,
    secret: false,
    type: 'text',
    fullWidth: true,
    placeholder: '[{"from":"/settings/integrations","to":"/settings/general","permanent":true}]',
    description: 'Array of <code>{ from, to, permanent }</code> paths applied in middleware (admin app).',
  },
];

export const UI_ENV_GROUPS = [
  {
    id: 'security',
    title: 'Security & Cron',
    icon: 'ri-shield-keyhole-line',
    description:
      'Retention for sessions and login activity audit data. Stored in the database and applied on save. Cron HTTP authentication uses <code>CRON_SECRET</code> in your deployment environment (not editable here).',
    column: 'left',
    keys: [
      'SESSION_PRUNE_KEEP_DAYS',
      'LOGIN_ACTIVITY_RETENTION_DAYS',
      'LOGIN_ACTIVITY_PER_USER_CAP',
      'RATE_LIMIT_AUTH_LOGIN_MAX',
      'RATE_LIMIT_AUTH_LOGIN_WINDOW_SEC',
      'RATE_LIMIT_PUBLIC_CONTACT_MAX',
      'RATE_LIMIT_PUBLIC_CONTACT_WINDOW_SEC',
      'REQUIRE_MFA_ADMINS',
      'REDIRECTS_JSON',
    ],
  },
  {
    id: 'integrations',
    title: 'Integrations',
    icon: 'ri-plug-line',
    description:
      'Analytics, webhooks, and Turnstile. Portfolio reads public keys from <code>/api/public/config</code>.',
    column: 'left',
    keys: [
      'ANALYTICS_PROVIDER',
      'ANALYTICS_SITE_ID',
      'WEBHOOK_PUBLISH_URL',
      'TURNSTILE_SITE_KEY',
      'TURNSTILE_SECRET_KEY',
    ],
  },
  {
    id: 'performance',
    title: 'Performance',
    icon: 'ri-speed-line',
    description:
      'Advanced toggles for CMS and media behavior. Leave defaults unless you are troubleshooting or running a one-off maintenance task.',
    column: 'left',
    keys: ['CMS_BATCH_WRITES', 'MEDIA_FULL_RECONCILE'],
  },
  {
    id: 'smtp',
    title: 'SMTP Email',
    icon: 'ri-mail-settings-line',
    description:
      'Outgoing mail configuration for <strong>Contact Messages → Reply</strong> and <strong>Users → send login credentials</strong>. Stored in the database. Without SMTP, those actions fail gracefully or show an error.',
    column: 'right',
    keys: [
      'SMTP_HOST',
      'SMTP_PORT',
      'SMTP_USER',
      'SMTP_PASS',
      'SMTP_FROM',
      'CONTACT_AUTO_REPLY_ENABLED',
      'CONTACT_AUTO_REPLY_SUBJECT',
      'CONTACT_AUTO_REPLY_BODY',
    ],
  },
  {
    id: 'branding',
    title: 'Email Branding',
    icon: 'ri-palette-line',
    description:
      'Optional visual identity in HTML emails (name, title, links). All fields are cosmetic and safe to leave empty.',
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
export const RUNTIME_CONFIG_KEYS = UI_ENV_DEFINITIONS.map((item) => item.key);
/** @deprecated Use RUNTIME_CONFIG_KEYS */
export const UI_ENV_KEYS = RUNTIME_CONFIG_KEYS;
export const RUNTIME_SECRET_KEYS = new Set(
  UI_ENV_DEFINITIONS.filter((item) => item.secret).map((item) => item.key),
);

export function getEnvFieldDefinition(key) {
  return DEF_BY_KEY.get(key);
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
