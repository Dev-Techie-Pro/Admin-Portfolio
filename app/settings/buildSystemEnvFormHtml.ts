import { UI_ENV_GROUPS, getEnvFieldDefinition } from '@/lib/admin/env-config';

function envFieldId(key: string) {
  return `envField_${key}`;
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
  return `<div class="pa-env-field-help">${parts.join('')}</div>`;
}

function renderFieldLabel(def) {
  const id = envFieldId(def.key);
  return `<label class="pa-form-label pa-env-field-label" for="${id}">
      <span class="pa-env-field-title">${def.label}</span>
      <code class="pa-env-field-key">${def.key}</code>
    </label>`;
}

function renderField(def) {
  const id = envFieldId(def.key);
  const help = renderFieldHelp(def);
  const label = renderFieldLabel(def);
  const full = def.fullWidth ? ' pa-form-group--full' : '';
  const placeholder = def.placeholder ? ` placeholder="${def.placeholder.replace(/"/g, '&quot;')}"` : '';

  if (def.secret || def.type === 'password') {
    return `
                                <div class="pa-form-group pa-env-form-group${full}">
                                    ${label}
                                    ${help}
                                    <div class="pa-password-wrap">
                                        <input class="pa-form-input" type="password" id="${id}" name="${def.key}" autocomplete="off" placeholder="Leave blank to keep current value" />
                                        <button type="button" class="pa-password-toggle" aria-label="Show value"><i class="ri-eye-line"></i></button>
                                    </div>
                                </div>`;
  }

  if (def.type === 'textarea') {
    return `
                                <div class="pa-form-group pa-env-form-group${full}">
                                    ${label}
                                    ${help}
                                    <textarea class="pa-form-textarea" id="${id}" name="${def.key}" rows="3" autocomplete="off"${placeholder}></textarea>
                                </div>`;
  }

  if (def.type === 'select' && def.options?.length) {
    const options = def.options
      .map((opt) => `<option value="${opt.value}">${opt.label}</option>`)
      .join('');
    return `
                                <div class="pa-form-group pa-env-form-group${full}">
                                    ${label}
                                    ${help}
                                    <select class="pa-form-select" id="${id}" name="${def.key}">${options}</select>
                                </div>`;
  }

  const inputType = def.type === 'number' ? 'number' : def.type === 'email' ? 'email' : def.type === 'url' ? 'url' : 'text';
  const extra = def.type === 'number' && def.key === 'SMTP_PORT' ? ' min="1" max="65535"' : def.type === 'number' ? ' min="1"' : '';

  return `
                                <div class="pa-form-group pa-env-form-group${full}">
                                    ${label}
                                    ${help}
                                    <input class="pa-form-input" type="${inputType}" id="${id}" name="${def.key}" autocomplete="off"${extra}${placeholder} />
                                </div>`;
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

  return `
                        <div class="pa-card-settings pa-env-card${marginClass}" id="systemEnvCard_${group.id}" data-env-group="${group.id}">
                            <div class="pa-card-title"><i class="${group.icon}"></i> ${group.title}</div>
                            <div class="pa-env-card-intro pa-text-mute fs-sm mb-16">${group.description}</div>
                            ${cronDeployNotice}
                            ${fieldsHtml}
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
                    <div class="pa-env-intro pa-info-box mb-16">
                        <p class="mb-8"><strong>Runtime settings</strong> (retention, SMTP, email branding, performance toggles) are saved to the database table <code>site_runtime_config</code> and apply on the next request.</p>
                        <ul class="pa-env-intro-list">
                            <li>Deployment-only: Supabase keys, <code>NEXT_PUBLIC_SITE_URL</code>, and <code>CRON_SECRET</code> stay in your host environment — see <code>.env.example</code>.</li>
                            <li>SMTP password is masked when set; leave blank on save to keep the current value.</li>
                            <li><strong>Import from env file</strong> uploads a <code>.env</code> (or similar) from your computer. Only runtime keys are applied; deployment secrets in the file are ignored. Matching fields overwrite saved values; keys not in the file stay as saved.</li>
                        </ul>
                    </div>
                    <div>
                        ${leftCards}
                    </div>
                    <div class="pa-settings-right-grid">
                        ${rightCards}
                        <div class="pa-settings-actions mt-16">
                            <button class="pa-btn pa-btn-primary" type="submit" id="systemEnvSaveBtn"><i class="ri-save-line"></i> Save Settings</button>
                            <input type="file" id="systemEnvImportFile" hidden accept=".env,.txt,text/plain,.local" />
                            <button class="pa-btn pa-btn-secondary flex-0-auto" type="button" id="systemEnvImportBtn"><i class="ri-upload-2-line"></i> Import from env file</button>
                            <button class="pa-btn pa-btn-secondary flex-0-auto" type="button" id="systemEnvReloadBtn"><i class="ri-refresh-line"></i> Reload</button>
                        </div>
                    </div>
                </form>`;
}
