import {
  escapeHtml
} from "./chunk-B2QR3Q5R.js";

// client/utils/listDataTable.ts
var DEFAULT_LIST_COLUMNS = [
  { label: "#", className: "pa-lv-col-num" },
  { label: "Project", className: "pa-lv-col-project" },
  { label: "Category" },
  { label: "Status", className: "pa-lv-col-status" },
  { label: "Created", className: "pa-lv-col-date" },
  { label: "Actions", className: "pa-lv-col-actions" }
];
function listStatusVariant(label) {
  const l = (label || "").trim().toLowerCase();
  if (l === "active" || l === "published" || l === "in progress") return "active";
  if (l === "completed" || l === "archived") return "completed";
  if (l === "on hold" || l === "inactive" || l === "cancelled") return "hold";
  if (l === "draft" || l === "pending" || l === "planning") return "planning";
  return "planning";
}
function renderListTableShell(columns, bodyHtml) {
  const ths = columns.map((col) => `<th scope="col" class="${col.className || ""}">${escapeHtml(col.label)}</th>`).join("");
  return `<div class="pa-lv-shell">
    <div class="pa-lv-scroll">
      <table class="pa-lv-table">
        <thead><tr>${ths}</tr></thead>
        <tbody>${bodyHtml}</tbody>
      </table>
    </div>
  </div>`;
}
function applyListGridClasses(grid, isList) {
  if (!grid) return;
  grid.classList.toggle("list-view", isList);
  grid.classList.toggle("pa-lv-mode", isList);
}
function syncListPaginationChrome(isList, paginationRoot) {
  const root = paginationRoot || document.querySelector(".pa-pagination");
  if (root) root.classList.toggle("pa-pagination--list", isList);
}
function renderListRowStart(rowClass = "") {
  return `<tr class="pa-lv-row${rowClass ? ` ${rowClass}` : ""}">`;
}
function renderListIndexCell(rowIndex) {
  return `<td class="pa-lv-col-num"><span class="pa-lv-index">${rowIndex}</span></td>`;
}
function renderListProjectCell(title, thumbInnerHtml) {
  const safe = escapeHtml(title);
  return `<td class="pa-lv-col-project">
    <div class="pa-lv-project">
      <div class="pa-lv-thumb" aria-hidden="true"><div class="pa-lv-thumb-inner">${thumbInnerHtml}</div></div>
      <span class="pa-lv-project-name" title="${safe}">${safe}</span>
    </div>
  </td>`;
}
function renderListIconProjectCell(title, iconHtml) {
  const thumb = `<div class="pa-lv-icon-thumb">${iconHtml}</div>`;
  return renderListProjectCell(title, thumb);
}
function renderListTextCell(text, className = "") {
  return `<td class="${className}"><span class="pa-lv-text">${escapeHtml(text || "\u2014")}</span></td>`;
}
function renderListStatusCell(label, variant) {
  const v = variant || listStatusVariant(label);
  return `<td class="pa-lv-col-status"><span class="pa-lv-status pa-lv-status--${v}">${escapeHtml(label || "\u2014")}</span></td>`;
}
function renderListDateCell(dateText) {
  return renderListTextCell(dateText, "pa-lv-col-date");
}
function listActionBtn(actionClass, iconClass, title, idAttr, id, ariaPrefix, extraClasses = "") {
  const safeId = escapeHtml(String(id));
  const safeTitle = escapeHtml(title);
  const label = escapeHtml(ariaPrefix ? `${ariaPrefix} ${title}` : title);
  const isDelete = actionClass.includes("delete");
  const variant = isDelete ? " pa-lv-action--delete" : "";
  const extra = extraClasses ? ` ${extraClasses}` : "";
  return `<button type="button" class="pa-lv-action pa-action-btn ${actionClass}${variant}${extra}" ${idAttr}="${safeId}" title="${escapeHtml(title)}" aria-label="${label} ${safeTitle}"><i class="${iconClass}"></i></button>`;
}
function renderListActionsCell(buttonsHtml) {
  return `<td class="pa-lv-col-actions"><div class="pa-lv-actions">${buttonsHtml}</div></td>`;
}
function renderListEditDeleteActions(opts) {
  const { idAttr, id, title, extraHtml = "" } = opts;
  const buttons = `${extraHtml}
    ${listActionBtn("pa-action-edit", "ri-pencil-line", "Edit", idAttr, id, "Edit")}
    ${listActionBtn("pa-action-delete", "ri-delete-bin-line", "Delete", idAttr, id, "Delete")}`;
  return renderListActionsCell(buttons);
}
function closeListRow() {
  return "</tr>";
}

export {
  DEFAULT_LIST_COLUMNS,
  renderListTableShell,
  applyListGridClasses,
  syncListPaginationChrome,
  renderListRowStart,
  renderListIndexCell,
  renderListProjectCell,
  renderListIconProjectCell,
  renderListTextCell,
  renderListStatusCell,
  renderListDateCell,
  listActionBtn,
  renderListActionsCell,
  renderListEditDeleteActions,
  closeListRow
};
//# sourceMappingURL=chunk-FL3A6ZLL.js.map
