// @ts-nocheck
import { escapeHtml } from './dom.js';

export type ListTableColumn = {
  label: string;
  className?: string;
};

export const DEFAULT_LIST_COLUMNS: ListTableColumn[] = [
  { label: '#', className: 'pa-lv-col-num' },
  { label: 'Project', className: 'pa-lv-col-project' },
  { label: 'Category' },
  { label: 'Status', className: 'pa-lv-col-status' },
  { label: 'Created', className: 'pa-lv-col-date' },
  { label: 'Actions', className: 'pa-lv-col-actions' },
];

export function listStatusVariant(label: string): string {
  const l = (label || '').trim().toLowerCase();
  if (l === 'active' || l === 'published' || l === 'in progress') return 'active';
  if (l === 'completed' || l === 'archived') return 'completed';
  if (l === 'on hold' || l === 'inactive' || l === 'cancelled') return 'hold';
  if (l === 'draft' || l === 'pending' || l === 'planning') return 'planning';
  return 'planning';
}

export function renderListTableShell(columns: ListTableColumn[], bodyHtml: string): string {
  const ths = columns
    .map((col) => `<th scope="col" class="${col.className || ''}">${escapeHtml(col.label)}</th>`)
    .join('');
  return `<div class="pa-lv-shell">
    <div class="pa-lv-scroll">
      <table class="pa-lv-table">
        <thead><tr>${ths}</tr></thead>
        <tbody>${bodyHtml}</tbody>
      </table>
    </div>
  </div>`;
}

export function applyListGridClasses(grid: HTMLElement | null, isList: boolean): void {
  if (!grid) return;
  grid.classList.toggle('list-view', isList);
  grid.classList.toggle('pa-lv-mode', isList);
}

export function syncListPaginationChrome(isList: boolean, paginationRoot?: HTMLElement | null): void {
  const root = paginationRoot
    || document.querySelector('.pa-pagination');
  if (root) root.classList.toggle('pa-pagination--list', isList);
}

export function renderListRowStart(rowClass = ''): string {
  return `<tr class="pa-lv-row${rowClass ? ` ${rowClass}` : ''}">`;
}

export function renderListIndexCell(rowIndex: number): string {
  return `<td class="pa-lv-col-num"><span class="pa-lv-index">${rowIndex}</span></td>`;
}

export function renderListProjectCell(title: string, thumbInnerHtml: string): string {
  const safe = escapeHtml(title);
  return `<td class="pa-lv-col-project">
    <div class="pa-lv-project">
      <div class="pa-lv-thumb" aria-hidden="true"><div class="pa-lv-thumb-inner">${thumbInnerHtml}</div></div>
      <span class="pa-lv-project-name" title="${safe}">${safe}</span>
    </div>
  </td>`;
}

export function renderListIconProjectCell(title: string, iconHtml: string): string {
  const thumb = `<div class="pa-lv-icon-thumb">${iconHtml}</div>`;
  return renderListProjectCell(title, thumb);
}

export function renderListTextCell(text: string, className = ''): string {
  return `<td class="${className}"><span class="pa-lv-text">${escapeHtml(text || '—')}</span></td>`;
}

export function renderListStatusCell(label: string, variant?: string): string {
  const v = variant || listStatusVariant(label);
  return `<td class="pa-lv-col-status"><span class="pa-lv-status pa-lv-status--${v}">${escapeHtml(label || '—')}</span></td>`;
}

export function renderListDateCell(dateText: string): string {
  return renderListTextCell(dateText, 'pa-lv-col-date');
}

/** Square list-view action button (matches grid card action classes for existing listeners). */
export function listActionBtn(
  actionClass: string,
  iconClass: string,
  title: string,
  idAttr: string,
  id: string | number,
  ariaPrefix?: string,
  extraClasses = '',
): string {
  const safeId = escapeHtml(String(id));
  const safeTitle = escapeHtml(title);
  const label = escapeHtml(ariaPrefix ? `${ariaPrefix} ${title}` : title);
  const isDelete = actionClass.includes('delete');
  const variant = isDelete ? ' pa-lv-action--delete' : '';
  const extra = extraClasses ? ` ${extraClasses}` : '';
  return `<button type="button" class="pa-lv-action pa-action-btn ${actionClass}${variant}${extra}" ${idAttr}="${safeId}" title="${escapeHtml(title)}" aria-label="${label} ${safeTitle}"><i class="${iconClass}"></i></button>`;
}

export function renderListActionsCell(buttonsHtml: string): string {
  return `<td class="pa-lv-col-actions"><div class="pa-lv-actions">${buttonsHtml}</div></td>`;
}

export type ListActionOpts = {
  idAttr: string;
  id: string | number;
  title: string;
  extraHtml?: string;
};

/** Default cat-style row actions: edit, delete (+ optional extra buttons before them). */
export function renderListEditDeleteActions(opts: ListActionOpts): string {
  const { idAttr, id, title, extraHtml = '' } = opts;
  const buttons = `${extraHtml}
    ${listActionBtn('pa-action-edit', 'ri-pencil-line', 'Edit', idAttr, id, 'Edit')}
    ${listActionBtn('pa-action-delete', 'ri-delete-bin-line', 'Delete', idAttr, id, 'Delete')}`;
  return renderListActionsCell(buttons);
}

export function closeListRow(): string {
  return '</tr>';
}
