// @ts-nocheck
import {
  UI_ENV_GROUPS,
  getEnvFieldDefinition,
  getEnvGroupFieldKeys,
} from '@/lib/admin/env-config';

function envFieldId(key: string) {
  return `envField_${key}`;
}

/** Fields that span both columns in the env form grid. */
const ENV_FULL_ROW_KEYS = new Set([
  'WEBHOOK_PUBLISH_URL',
  'REDIRECTS_JSON',
  'CONTACT_AUTO_REPLY_BODY',
]);

function envFieldSpansFullRow(def) {
  if (def.control === 'chips') return true;
  if (def.type === 'textarea') return true;
  return ENV_FULL_ROW_KEYS.has(def.key);
}

function stripHtml(html: string) {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function renderFieldTip(def) {
  const tip = stripHtml(def.description || def.hint || '');
  if (!tip) return '';
  return `<button type="button" class="pa-env-info-tip" aria-label="Field help" data-pa-env-tip="${tip.replace(/"/g, '&quot;')}"><i class="ri-information-line" aria-hidden="true"></i></button>`;
}

function renderFieldLabel(def, { uppercase = false } = {}) {
  const id = envFieldId(def.key);
  const titleClass = uppercase ? 'pa-env-field-title pa-env-field-title--caps' : 'pa-env-field-title';
  const popover = renderFieldHelp(def);
  return `<label class="pa-form-label pa-env-field-label" for="${id}">
      <span class="pa-env-field-label-main">
        <span class="${titleClass}">${def.label}</span>
        ${renderFieldTip(def)}
      </span>
      ${popover}
    </label>`;
}

function renderFieldGroupHeading(def, { uppercase = false } = {}) {
  const headingId = `${envFieldId(def.key)}_label`;
  const titleClass = uppercase ? 'pa-env-field-title pa-env-field-title--caps' : 'pa-env-field-title';
  const popover = renderFieldHelp(def);
  return `<div class="pa-form-label pa-env-field-label" id="${headingId}">
      <span class="pa-env-field-label-main">
        <span class="${titleClass}">${def.label}</span>
        ${renderFieldTip(def)}
      </span>
      ${popover}
    </div>`;
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
  if (!parts.length) return '';
  return `<div class="pa-env-field-popover" role="tooltip">${parts.join('')}</div>`;
}

function wrapEnvFieldRow(def, controlHtml: string, extraClass = '') {
  const full = envFieldSpansFullRow(def) ? ' pa-form-group--full' : '';
  const toggle = def.control === 'toggle' ? ' pa-env-field-row--toggle' : '';
  return `
                                <div class="pa-env-field-row pa-form-group pa-env-form-group${full}${toggle}${extraClass}" data-env-field="${def.key}">
                                    <div class="pa-env-field-control">
                                        ${controlHtml}
                                    </div>
                                </div>`;
}

function renderToggleField(def) {
  const id = envFieldId(def.key);
  const popover = renderFieldHelp(def);
  const control = `
                                    <div class="pa-toggle-wrap pa-env-toggle-wrap">
                                        <label class="pa-env-toggle-label" for="${id}">
                                            <span class="pa-toggle-label">${def.label}</span>
                                            ${renderFieldTip(def)}
                                            ${popover}
                                        </label>
                                        <label class="pa-toggle-switch" for="${id}">
                                            <input type="checkbox" class="pa-env-toggle-checkbox" id="${id}" data-env-toggle-key="${def.key}" />
                                            <span class="pa-toggle-slider"></span>
                                        </label>
                                    </div>
                                    <input type="hidden" class="pa-env-toggle-value" name="${def.key}" value="" />`;
  return wrapEnvFieldRow(def, control);
}

function renderChipsField(def) {
  const label = renderFieldGroupHeading(def, { uppercase: true });
  const headingId = `${envFieldId(def.key)}_label`;
  const chips = (def.options || [])
    .map((opt) => {
      const chipId = `${envFieldId(def.key)}_${opt.value || 'none'}`;
      const short = opt.label.replace(/^Google Analytics 4$/i, 'GA4').replace(/^Default —.*$/i, opt.label);
      return `<label class="pa-env-chip" for="${chipId}">
          <input type="radio" class="pa-env-chip-input" id="${chipId}" name="${def.key}" value="${opt.value}" />
          <span class="pa-env-chip-text">${short}</span>
        </label>`;
    })
    .join('');
  const control = `${label}
                                    <div class="pa-env-chip-group pa-env-chip-group--segmented" role="radiogroup" aria-labelledby="${headingId}">
                                        ${chips}
                                    </div>`;
  return wrapEnvFieldRow(def, control, ' pa-env-field-row--full pa-env-field-row--chips');
}

function renderInputField(def) {
  const id = envFieldId(def.key);
  const label = renderFieldLabel(def);
  const placeholder = def.placeholder ? ` placeholder="${def.placeholder.replace(/"/g, '&quot;')}"` : '';

  if (def.secret || def.type === 'password') {
    const control = `${label}
                                    <div class="pa-password-wrap">
                                        <input class="pa-form-input pa-env-input" type="password" id="${id}" name="${def.key}" autocomplete="off" placeholder="Leave blank to keep current value" />
                                        <button type="button" class="pa-password-toggle" aria-label="Show value"><i class="ri-eye-line"></i></button>
                                    </div>`;
    return wrapEnvFieldRow(def, control);
  }

  if (def.type === 'textarea') {
    const control = `${label}
                                    <textarea class="pa-form-textarea pa-env-input" id="${id}" name="${def.key}" rows="3" autocomplete="off"${placeholder}></textarea>`;
    return wrapEnvFieldRow(def, control);
  }

  const inputType = def.type === 'number' ? 'number' : def.type === 'email' ? 'email' : def.type === 'url' ? 'url' : 'text';
  const extra = def.type === 'number' && def.key === 'SMTP_PORT' ? ' min="1" max="65535"' : def.type === 'number' ? ' min="1"' : '';

  if (def.unitSuffix) {
    const control = `${label}
                                    <div class="pa-env-input-suffix-wrap">
                                        <input class="pa-form-input pa-env-input" type="${inputType}" id="${id}" name="${def.key}" autocomplete="off"${extra}${placeholder} />
                                        <span class="pa-env-input-suffix">${def.unitSuffix}</span>
                                    </div>`;
    return wrapEnvFieldRow(def, control);
  }

  const control = `${label}
                                    <input class="pa-form-input pa-env-input" type="${inputType}" id="${id}" name="${def.key}" autocomplete="off"${extra}${placeholder} />`;
  return wrapEnvFieldRow(def, control);
}

function renderField(def) {
  if (def.control === 'toggle') return renderToggleField(def);
  if (def.control === 'chips' && def.options?.length) return renderChipsField(def);
  return renderInputField(def);
}

function renderSection(title: string, keys: string[]) {
  const fields = keys.map((key) => getEnvFieldDefinition(key)).filter(Boolean);
  if (!fields.length) return '';
  return `
                            <div class="pa-env-subsection">
                                <h4 class="pa-env-subsection-title">${title}</h4>
                                <div class="pa-env-card-fields">
                                    ${fields.map((f) => renderField(f)).join('')}
                                </div>
                            </div>`;
}

function renderGroupBody(group) {
  if (group.sections?.length) {
    return group.sections
      .map((section) => renderSection(section.title, section.keys))
      .join('');
  }

  const keys = getEnvGroupFieldKeys(group);
  const fields = keys.map((key) => getEnvFieldDefinition(key)).filter(Boolean);
  const chipFirst = fields.filter((f) => f.control === 'chips');
  const rest = fields.filter((f) => f.control !== 'chips');

  const chipsHtml = chipFirst.map((f) => renderField(f)).join('');
  const restHtml = rest.map((f) => renderField(f)).join('');

  return `
                            ${chipsHtml ? `<div class="pa-env-subsection pa-env-subsection--chips">${chipsHtml}</div>` : ''}
                            <div class="pa-env-card-fields">
                            ${restHtml}
                            </div>`;
}

function renderGroupStepPanel(group, index: number) {
  const tone = group.tone ? ` pa-env-tone-${group.tone}` : '';
  const hidden = index === 0 ? '' : ' hidden';
  const activeClass = index === 0 ? ' is-active' : '';

  return `
                        <div class="pa-card-settings pa-env-step-panel${activeClass}" id="systemEnvStep_${group.id}" data-env-step-panel="${group.id}" data-env-step-index="${index}" role="tabpanel"${hidden} aria-labelledby="systemEnvTimelineStep_${group.id}">
                            <div class="pa-env-step-panel-head">
                                <span class="pa-env-step-panel-icon${tone}" aria-hidden="true"><i class="${group.icon}"></i></span>
                                <div class="pa-env-step-panel-head-copy">
                                    <h3 class="pa-env-step-panel-title">${group.title}</h3>
                                    <p class="pa-env-step-panel-desc pa-text-mute fs-sm mb-0">${group.description}</p>
                                </div>
                            </div>
                            <div class="pa-env-step-panel-body">
                            ${renderGroupBody(group)}
                            </div>
                        </div>`;
}

function renderEnvProcessTimeline() {
  const steps = UI_ENV_GROUPS.map((group, index) => {
    const label = group.stepLabel || group.title;
    const isFirst = index === 0;
    const isLast = index === UI_ENV_GROUPS.length - 1;
    const stateClass = index === 0 ? ' is-active' : ' is-pending';
    return `
                        <button type="button" class="pa-env-timeline-step${stateClass}" id="systemEnvTimelineStep_${group.id}" data-env-step="${group.id}" data-env-step-index="${index}" role="tab" aria-selected="${index === 0 ? 'true' : 'false'}" aria-controls="systemEnvStep_${group.id}">
                            <span class="pa-env-timeline-icon" aria-hidden="true"><i class="${group.icon}"></i></span>
                            <span class="pa-env-timeline-rail" aria-hidden="true">
                                <span class="pa-env-timeline-line pa-env-timeline-line--before${isFirst ? ' is-empty' : ''}"></span>
                                <span class="pa-env-timeline-node">
                                    <i class="pa-env-timeline-node-icon pa-env-timeline-node-icon--check ri-check-line" aria-hidden="true"></i>
                                    <i class="pa-env-timeline-node-icon pa-env-timeline-node-icon--active ri-loader-4-line" aria-hidden="true"></i>
                                    <span class="pa-env-timeline-node-dot" aria-hidden="true"></span>
                                </span>
                                <span class="pa-env-timeline-line pa-env-timeline-line--after${isLast ? ' is-empty' : ''}"></span>
                            </span>
                            <span class="pa-env-timeline-label">${label}</span>
                        </button>`;
  }).join('');

  return `
                    <div class="pa-env-process">
                        <div class="pa-env-timeline" role="tablist" aria-label="Environment configuration steps">
                            ${steps}
                        </div>
                    </div>`;
}

/** Server-rendered environment form (timeline + step panels). */
export function buildSystemEnvFormHtml(): string {
  const panels = UI_ENV_GROUPS.map((g, i) => renderGroupStepPanel(g, i)).join('');

  return `
                <form id="systemEnvForm" class="pa-settings-grid pa-env-form pa-env-form--wizard" novalidate>
                    ${renderEnvProcessTimeline()}
                    <div class="pa-env-step-panels">
                        ${panels}
                    </div>
                    <div class="pa-env-actions-bar pa-settings-actions">
                        <div class="pa-env-unsaved" id="systemEnvDirty" hidden>
                            <span class="pa-env-unsaved-dot" aria-hidden="true"></span>
                            <span>Unsaved changes</span>
                        </div>
                        <button class="pa-btn pa-btn-secondary flex-0-auto" type="button" id="systemEnvStepPrevBtn" data-env-step-prev disabled><i class="ri-arrow-left-s-line"></i> Previous</button>
                        <button class="pa-btn pa-btn-secondary flex-0-auto" type="button" id="systemEnvStepNextBtn" data-env-step-next>Next <i class="ri-arrow-right-s-line"></i></button>
                        <button class="pa-btn pa-btn-secondary flex-0-auto" type="button" id="systemEnvReloadBtn" data-env-finalize-action hidden disabled><i class="ri-refresh-line"></i> Reload</button>
                        <input type="file" id="systemEnvImportFile" name="systemEnvImportFile" hidden accept=".env,.txt,text/plain,.local" />
                        <button class="pa-btn pa-btn-secondary flex-0-auto" type="button" id="systemEnvImportBtn" data-env-finalize-action hidden disabled><i class="ri-upload-2-line"></i> Import from .env file</button>
                        <button class="pa-btn pa-env-save-btn" type="submit" id="systemEnvSaveBtn" data-env-finalize-action hidden disabled><i class="ri-check-line"></i> Save Settings</button>
                    </div>
                </form>`;
}
