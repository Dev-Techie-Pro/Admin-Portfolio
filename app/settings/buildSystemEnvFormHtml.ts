import { UI_ENV_GROUPS, getEnvFieldDefinition } from '@/lib/admin/env-config';

function envFieldId(key: string) {
  return `envField_${key}`;
}

const DEFAULT_OPEN_GROUPS = new Set(['security', 'smtp']);

function shouldUseLearnMore(def) {
  if (def.details?.length) return true;
  const desc = def.description || def.hint || '';
  const detailsText = (def.details || []).join('');
  return desc.length + detailsText.length > 120;
}

function renderFieldHelp(def) {
  const parts: string[] = [];
  if (def.description) {
    parts.push(`<p class="pa-env-field-desc">${def.description}</p>`);
  }
  if (def.details?.length) {
    parts.push(
      `<ul class="pa-env-field-details">${def.details.map((line) => `<li>${line}</li>`).join('')}</ul>`,
    );
  }
  if (def.defaultValue) {
    parts.push(
      `<p class="pa-env-field-default"><i class="ri-flag-line"></i> <span>Default:</span> ${def.defaultValue}</p>`,
    );
  }
  if (!parts.length && def.hint) {
    parts.push(`<p class="pa-env-field-desc">${def.hint}</p>`);
  }
  if (!parts.length) return '';
  return `<div class="pa-env-field-help pa-collapse-panel" data-pa-collapse-panel>${parts.join('')}</div>`;
}

function renderFieldHelpBlock(def) {
  const help = renderFieldHelp(def);
  if (!help) return '';
  if (shouldUseLearnMore(def)) {
    return `<details class="pa-env-field-more pa-collapse-details">
                                    <summary class="pa-env-field-more-summary"><i class="ri-information-line" aria-hidden="true"></i> Learn more</summary>
                                    ${help}
                                </details>`;
  }
  return `<div class="pa-env-field-help-compact">${help}</div>`;
}

function renderFieldLabel(def) {
  const id = envFieldId(def.key);
  return `<label class="pa-form-label pa-env-field-label" for="${id}">
      <span class="pa-env-field-label-main">
        <span class="pa-env-field-title">${def.label}</span>
        <code class="pa-env-field-key">${def.key}</code>
      </span>
    </label>`;
}

function wrapEnvFieldRow(def, controlHtml: string, helpBlock: string) {
  const full = def.fullWidth ? ' pa-form-group--full' : '';
  return `
                                <div class="pa-env-field-row pa-form-group pa-env-form-group${full}">
                                    <div class="pa-env-field-control">
                                        ${controlHtml}
                                        ${helpBlock}
                                    </div>
                                </div>`;
}

function renderField(def) {
  const id = envFieldId(def.key);
  const helpBlock = renderFieldHelpBlock(def);
  const label = renderFieldLabel(def);
  const placeholder = def.placeholder ? ` placeholder="${def.placeholder.replace(/"/g, '&quot;')}"` : '';

  if (def.secret || def.type === 'password') {
    const control = `${label}
                                    <div class="pa-password-wrap">
                                        <input class="pa-form-input" type="password" id="${id}" name="${def.key}" autocomplete="off" placeholder="Leave blank to keep current value" />
                                        <button type="button" class="pa-password-toggle" aria-label="Show value"><i class="ri-eye-line"></i></button>
                                    </div>`;
    return wrapEnvFieldRow(def, control, helpBlock);
  }

  if (def.type === 'textarea') {
    const control = `${label}
                                    <textarea class="pa-form-textarea" id="${id}" name="${def.key}" rows="3" autocomplete="off"${placeholder}></textarea>`;
    return wrapEnvFieldRow(def, control, helpBlock);
  }

  if (def.type === 'select' && def.options?.length) {
    const options = def.options
      .map((opt) => `<option value="${opt.value}">${opt.label}</option>`)
      .join('');
    const control = `${label}
                                    <select class="pa-form-select" id="${id}" name="${def.key}">${options}</select>`;
    return wrapEnvFieldRow(def, control, helpBlock);
  }

  const inputType = def.type === 'number' ? 'number' : def.type === 'email' ? 'email' : def.type === 'url' ? 'url' : 'text';
  const extra = def.type === 'number' && def.key === 'SMTP_PORT' ? ' min="1" max="65535"' : def.type === 'number' ? ' min="1"' : '';

  const control = `${label}
                                    <input class="pa-form-input" type="${inputType}" id="${id}" name="${def.key}" autocomplete="off"${extra}${placeholder} />`;
  return wrapEnvFieldRow(def, control, helpBlock);
}

function renderGroupCard(group, { firstInColumn = false } = {}) {
  const marginClass = firstInColumn ? '' : ' mt-10';
  const fields = group.keys
    .map((key) => getEnvFieldDefinition(key))
    .filter(Boolean);

  const cronDeployNotice = group.id === 'security'
    ? `<div class="pa-env-deploy-notice pa-info-box fs-sm mb-16">
                            <p class="mb-0"><strong>CRON_SECRET</strong> is not stored here. Set it in your deployment environment (<code>.env.local</code> / Vercel env vars) so scheduled calls to <code>/api/cron/*</code> can authenticate with <code>Authorization: Bearer …</code>.</p>
                          </div>`
    : '';

  const fieldsHtml = fields.map((f) => renderField(f)).join('');
  const fieldCount = fields.length;
  const defaultOpen = DEFAULT_OPEN_GROUPS.has(group.id);
  const collapsedClass = defaultOpen ? '' : ' is-collapsed';
  const expandedAttr = defaultOpen ? 'true' : 'false';
  const bodyId = `systemEnvCardBody_${group.id}`;

  return `
                        <div class="pa-card-settings pa-env-card pa-surface-interactive${marginClass}${collapsedClass}" id="systemEnvCard_${group.id}" data-env-group="${group.id}" data-env-default-open="${defaultOpen ? 'true' : 'false'}" data-pa-collapse data-pa-collapse-class="is-collapsed">
                            <button type="button" class="pa-env-card-head pa-env-card-toggle pa-collapse-trigger" data-pa-collapse-trigger aria-expanded="${expandedAttr}" aria-controls="${bodyId}">
                                <span class="pa-env-card-head-icon" aria-hidden="true"><i class="${group.icon}"></i></span>
                                <span class="pa-env-card-head-copy">
                                    <span class="pa-env-card-head-title">${group.title}</span>
                                    <span class="pa-env-card-intro pa-text-mute fs-sm">${group.description}</span>
                                </span>
                                <span class="pa-env-card-head-count" aria-label="${fieldCount} settings">${fieldCount}</span>
                                <i class="ri-arrow-down-s-line pa-env-card-chevron" aria-hidden="true"></i>
                            </button>
                            <div class="pa-env-card-body pa-collapse-panel" data-pa-collapse-panel id="${bodyId}">
                            ${cronDeployNotice}
                            <div class="pa-env-card-fields">
                            ${fieldsHtml}
                            </div>
                            </div>
                        </div>`;
}

const INTRO_LIST_ITEMS = [
  {
    icon: 'ri-server-line',
    html: 'Deployment-only: Supabase keys, <code>NEXT_PUBLIC_SITE_URL</code>, and <code>CRON_SECRET</code> stay in your host environment — see <code>.env.example</code>.',
  },
  {
    icon: 'ri-lock-password-line',
    html: 'SMTP password is masked when set; leave blank on save to keep the current value.',
  },
  {
    icon: 'ri-upload-2-line',
    html: '<strong>Import from env file</strong> uploads a <code>.env</code> (or similar) from your computer. Only runtime keys are applied; deployment secrets in the file are ignored. Matching fields overwrite saved values; keys not in the file stay as saved.',
  },
];

function renderEnvIntro() {
  const listItems = INTRO_LIST_ITEMS.map(
    (item) => `<li class="pa-env-intro-list-item">
                            <span class="pa-env-intro-list-icon" aria-hidden="true"><i class="${item.icon}"></i></span>
                            <span class="pa-env-intro-list-text">${item.html}</span>
                        </li>`,
  ).join('');

  return `
                    <div class="pa-env-intro pa-info-box mb-16">
                        <details class="pa-env-intro-tips pa-collapse-details">
                            <summary class="pa-env-intro-tips-summary">
                                <i class="ri-lightbulb-line" aria-hidden="true"></i>
                                <span>Runtime tips</span>
                                <span class="pa-env-intro-tips-count">(3)</span>
                            </summary>
                            <div class="pa-env-intro-tips-body pa-collapse-panel" data-pa-collapse-panel>
                                <p class="pa-env-intro-lead mb-12"><strong>Runtime settings</strong> are stored in <code>site_runtime_config</code>. Retention, SMTP, email branding, and performance toggles apply on the next request after save.</p>
                                <ul class="pa-env-intro-list">
                                    ${listItems}
                                </ul>
                            </div>
                        </details>
                    </div>`;
}

/** Server-rendered environment form cards (single source of truth with lib/admin/env-config). */
export function buildSystemEnvFormHtml(): string {
  const leftGroups = UI_ENV_GROUPS.filter((g) => g.column === 'left');
  const rightGroups = UI_ENV_GROUPS.filter((g) => g.column === 'right');

  const leftCards = leftGroups
    .map((g, i) => renderGroupCard(g, { firstInColumn: i === 0 }))
    .join('');

  const rightCards = rightGroups
    .map((g, i) => renderGroupCard(g, { firstInColumn: i === 0 }))
    .join('');

  return `
                <form id="systemEnvForm" class="pa-settings-grid pa-env-form" novalidate>
                    ${renderEnvIntro()}
                    <div class="pa-env-column pa-motion-stagger">
                        ${leftCards}
                    </div>
                    <div class="pa-settings-right-grid pa-env-column pa-motion-stagger">
                        ${rightCards}
                    </div>
                    <div class="pa-env-actions-bar pa-settings-actions">
                        <button class="pa-btn pa-btn-primary" type="submit" id="systemEnvSaveBtn"><i class="ri-save-line"></i> Save Settings</button>
                        <input type="file" id="systemEnvImportFile" hidden accept=".env,.txt,text/plain,.local" />
                        <button class="pa-btn pa-btn-secondary flex-0-auto" type="button" id="systemEnvImportBtn"><i class="ri-upload-2-line"></i> Import from env file</button>
                        <button class="pa-btn pa-btn-secondary flex-0-auto" type="button" id="systemEnvReloadBtn"><i class="ri-refresh-line"></i> Reload</button>
                    </div>
                </form>`;
}
