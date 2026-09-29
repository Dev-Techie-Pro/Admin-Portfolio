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

  const fieldsHtml = fields.map((f) => renderField(f)).join('');

  return `
                        <div class="pa-card-settings pa-env-card${marginClass}" id="systemEnvCard_${group.id}" data-env-group="${group.id}">
                            <div class="pa-card-title"><i class="${group.icon}"></i> ${group.title}</div>
                            <div class="pa-env-card-intro pa-text-mute fs-sm mb-16">${group.description}</div>
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
                        <p class="mb-8"><strong>Environment variables</strong> configure cron jobs, retention, mail delivery, and email branding. They are stored in <code>.env.local</code> on the server (not in the database).</p>
                        <ul class="pa-env-intro-list">
                            <li>Secret fields show a masked value when already set; leave blank on save to keep the current secret.</li>
                            <li>Supabase and site URL are configured in <code>.env.local</code> / <code>.env.example</code> — not on this screen.</li>
                            <li>After saving, restart the dev server or redeploy if a variable does not appear to apply immediately.</li>
                        </ul>
                    </div>
                    <div>
                        ${leftCards}
                    </div>
                    <div class="pa-settings-right-grid">
                        ${rightCards}
                        <div class="pa-settings-actions mt-16">
                            <button class="pa-btn pa-btn-primary" type="submit" id="systemEnvSaveBtn"><i class="ri-save-line"></i> Save Environment</button>
                            <button class="pa-btn pa-btn-secondary flex-0-auto" type="button" id="systemEnvReloadBtn"><i class="ri-refresh-line"></i> Reload</button>
                        </div>
                    </div>
                </form>`;
}
