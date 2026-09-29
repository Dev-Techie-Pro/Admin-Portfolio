import { UI_ENV_GROUPS, getEnvFieldDefinition } from '@/lib/admin/env-config';

function envFieldId(key: string) {
  return `envField_${key}`;
}

function renderField(def) {
  const id = envFieldId(def.key);
  const hint = def.hint
    ? `<div class="pa-form-hint fs-sm mt-4"><i class="ri-information-line"></i> ${def.hint}</div>`
    : '';
  const full = def.fullWidth ? ' pa-form-group--full' : '';

  if (def.secret || def.type === 'password') {
    return `
                                <div class="pa-form-group${full}">
                                    <label class="pa-form-label" for="${id}">${def.label}</label>
                                    <div class="pa-password-wrap">
                                        <input class="pa-form-input" type="password" id="${id}" name="${def.key}" autocomplete="off" placeholder="Leave blank to keep current value" />
                                        <button type="button" class="pa-password-toggle" aria-label="Show value"><i class="ri-eye-line"></i></button>
                                    </div>
                                    ${hint}
                                </div>`;
  }

  if (def.type === 'textarea') {
    return `
                                <div class="pa-form-group${full}">
                                    <label class="pa-form-label" for="${id}">${def.label}</label>
                                    <textarea class="pa-form-textarea" id="${id}" name="${def.key}" rows="3" autocomplete="off"></textarea>
                                    ${hint}
                                </div>`;
  }

  if (def.type === 'select' && def.options?.length) {
    const options = def.options
      .map((opt) => `<option value="${opt.value}">${opt.label}</option>`)
      .join('');
    return `
                                <div class="pa-form-group${full}">
                                    <label class="pa-form-label" for="${id}">${def.label}</label>
                                    <select class="pa-form-select" id="${id}" name="${def.key}">${options}</select>
                                    ${hint}
                                </div>`;
  }

  const inputType = def.type === 'number' ? 'number' : def.type === 'email' ? 'email' : def.type === 'url' ? 'url' : 'text';
  const extra = def.type === 'number' && def.key === 'SMTP_PORT' ? ' min="1" max="65535"' : def.type === 'number' ? ' min="1"' : '';

  return `
                                <div class="pa-form-group${full}">
                                    <label class="pa-form-label" for="${id}">${def.label}</label>
                                    <input class="pa-form-input" type="${inputType}" id="${id}" name="${def.key}" autocomplete="off"${extra} />
                                    ${hint}
                                </div>`;
}

function renderGroupCard(group, { firstInColumn = false } = {}) {
  const marginClass = firstInColumn ? '' : ' mt-10';
  const fields = group.keys
    .map((key) => getEnvFieldDefinition(key))
    .filter(Boolean);

  const pairable = fields.filter((f) => !f.fullWidth && f.type !== 'textarea');
  const fullWidthFields = fields.filter((f) => f.fullWidth || f.type === 'textarea');

  let fieldsHtml = '';
  for (let i = 0; i < pairable.length; i += 2) {
    const a = pairable[i];
    const b = pairable[i + 1];
    fieldsHtml += `<div class="grid fr-2">${renderField(a)}${b ? renderField(b) : ''}</div>`;
  }
  for (const f of fullWidthFields) {
    fieldsHtml += renderField(f);
  }

  return `
                        <div class="pa-card-settings${marginClass}" id="systemEnvCard_${group.id}" data-env-group="${group.id}">
                            <div class="pa-card-title"><i class="${group.icon}"></i> ${group.title}</div>
                            <div class="pa-text-mute fs-sm mb-16">${group.description}</div>
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
                <form id="systemEnvForm" class="pa-settings-grid" novalidate>
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
