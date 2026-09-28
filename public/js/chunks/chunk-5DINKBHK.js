import {
  escapeHtml
} from "./chunk-S5QBHCBR.js";

// client/utils/format.ts
function deriveDataUrlSize(url) {
  if (typeof url !== "string" || !url.startsWith("data:")) return 0;
  const comma = url.indexOf(",");
  if (comma === -1) return 0;
  const payload = url.slice(comma + 1);
  return payload ? Math.floor(payload.length * 3 / 4) : 0;
}
function formatFileSize(bytes, url) {
  let size = bytes;
  if (!size && url) size = deriveDataUrlSize(url);
  if (!size || size <= 0) return "Unknown size";
  const units = ["B", "KB", "MB", "GB"];
  let i = 0;
  let val = size;
  while (val >= 1024 && i < units.length - 1) {
    val /= 1024;
    i++;
  }
  return `${val.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}
function formatDate(iso) {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "Unknown";
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return "Unknown";
  }
}
function formatMonthYear(ym) {
  if (!ym) return "";
  const [y, m] = ym.split("-").map(Number);
  if (!y || !m) return ym;
  const d = new Date(y, m - 1, 1);
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}
function timeAgo(iso) {
  try {
    const then = new Date(iso).getTime();
    if (Number.isNaN(then)) return "";
    const diffMs = Date.now() - then;
    if (diffMs < 0) return formatDate(iso);
    const mins = Math.floor(diffMs / 6e4);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    const weeks = Math.floor(days / 7);
    if (weeks < 5) return `${weeks}w ago`;
    return formatDate(iso);
  } catch {
    return "";
  }
}
function parseYearsInput(raw) {
  const trimmed = (raw || "").trim();
  if (trimmed === "") return null;
  const n = parseFloat(trimmed);
  return Number.isNaN(n) ? null : n;
}
function parseSortInput(raw, fallback) {
  const trimmed = (raw || "").trim();
  if (trimmed === "") return fallback;
  const n = parseInt(trimmed, 10);
  return Number.isNaN(n) ? fallback : n;
}
function toTimestamp(value) {
  if (!value) return 0;
  const t = new Date(value).getTime();
  return Number.isFinite(t) ? t : 0;
}
function sortByNewestFirst(records, field = "createdAt") {
  return records.slice().sort((a, b) => toTimestamp(b[field]) - toTimestamp(a[field]));
}
function csvEscapeField(val) {
  const str = val == null ? "" : String(val);
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

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
  formatFileSize,
  formatDate,
  formatMonthYear,
  timeAgo,
  parseYearsInput,
  parseSortInput,
  sortByNewestFirst,
  csvEscapeField,
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
