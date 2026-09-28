import { escapeHtml } from "./dom.js";
import { normalizeCategoryKey } from "./categoryClassOptions.js";
import {
  closeListRow,
  renderListDateCell,
  renderListEditDeleteActions,
  renderListIconProjectCell,
  renderListIndexCell,
  renderListRowStart,
  renderListStatusCell,
  renderListTextCell
} from "./listDataTable.js";
function renderPaCatCardViewBtn(idAttr, id, opts = {}) {
  const safeId = escapeHtml(String(id));
  const title = escapeHtml(opts.title || "View");
  const ariaLabel = escapeHtml(opts.ariaLabel || opts.title || "View");
  const extra = opts.extraClasses ? ` ${opts.extraClasses}` : "";
  return `<button type="button" class="pa-action-btn pa-action-view pa-cat-card__view-btn${extra}" ${idAttr}="${safeId}" title="${title}" aria-label="${ariaLabel}"><i class="ri-eye-line"></i></button>`;
}
function renderPaCatCard(opts) {
  const {
    idAttr,
    id,
    catKey = "",
    cardClass = "",
    bulkCheckbox = "",
    iconHtml,
    badge = "",
    title,
    slug,
    desc = "",
    countIcon = "ri-file-list-line",
    countLabel,
    status = "Active",
    dateLabel = "Created",
    dateValue = "\u2014",
    viewBtn = null,
    menuHtml
  } = opts;
  const safeId = escapeHtml(String(id));
  const safeTitle = escapeHtml(title);
  const safeSlug = escapeHtml(slug);
  const safeCatKey = escapeHtml(normalizeCategoryKey(catKey));
  const descHtml = desc ? escapeHtml(desc) : '<em class="pa-cat-card__desc-empty">No description</em>';
  const safeCount = escapeHtml(countLabel);
  const safeStatus = escapeHtml(status);
  const safeDateLabel = escapeHtml(dateLabel);
  const safeDateValue = escapeHtml(dateValue);
  const viewBtnHtml = viewBtn ? renderPaCatCardViewBtn(idAttr, id, { title: viewBtn.label, ariaLabel: viewBtn.ariaLabel || viewBtn.label }) : "";
  const chevronHtml = viewBtn ? `<button type="button" class="pa-cat-card__chevron" ${idAttr}="${safeId}" aria-label="${escapeHtml(viewBtn.ariaLabel || viewBtn.label)}"><i class="ri-arrow-right-s-line"></i></button>` : "";
  const classes = ["pa-card", "pa-cat-card", cardClass].filter(Boolean).join(" ");
  const catKeyAttr = safeCatKey ? ` data-cat-key="${safeCatKey}"` : "";
  return `<div class="${classes}" ${idAttr}="${safeId}"${catKeyAttr}>
    ${bulkCheckbox}
    <div class="pa-cat-card__bg" aria-hidden="true"></div>
    <div class="pa-cat-card__grid">
      <div class="pa-cat-card__top justify-between">
        <div class="pa-cat-card__top__head">
          <div class="pa-cat-card__icon">${iconHtml}</div>
          <div class="pa-cat-card__top-content">
            <h3 class="pa-cat-card__title" title="${safeTitle}">${safeTitle}</h3>
            <div class="pa-cat-card__slug"><span class="pa-cat-card__slug-mark" aria-hidden="true">\u25C6</span>${safeSlug}</div>
          </div>
        </div>
        ${badge}
      </div>
      <p class="pa-cat-card__desc">${descHtml}</p>
      <div class="pa-cat-card__count"><i class="${countIcon}"></i><span>${safeCount}</span></div>
      <div class="pa-cat-card__footer pa-cat-card__footer--solo">
        <div class="pa-cat-card__footer-more">
          ${viewBtnHtml}
          <button type="button" class="pa-action-btn pa-action-edit" ${idAttr}="${safeId}" title="Edit" aria-label="Edit ${safeTitle}"><i class="ri-pencil-line"></i></button>
          <button type="button" class="pa-action-btn pa-action-delete" ${idAttr}="${safeId}" title="Delete" aria-label="Delete ${safeTitle}"><i class="ri-delete-bin-line"></i></button>
          <button type="button" class="pa-action-btn pa-action-more" ${idAttr}="${safeId}" title="More options" aria-label="More options for ${safeTitle}"><i class="ri-more-2-fill"></i></button>
          ${menuHtml}
        </div>
      </div>
    </div>
    <div class="pa-cat-card__list">
      <div class="pa-cat-card__icon">${iconHtml}</div>
      <div class="pa-cat-card__list-main">
        <div class="pa-cat-card__title" title="${safeTitle}">${safeTitle}</div>
        <div class="pa-cat-card__slug"><span class="pa-cat-card__slug-mark" aria-hidden="true">\u25C6</span>${safeSlug}</div>
        <div class="pa-cat-card__desc">${descHtml}</div>
      </div>
      <div class="pa-cat-card__count"><i class="${countIcon}"></i><span>${safeCount}</span></div>
      <div class="pa-cat-card__status">${safeStatus}</div>
      <div class="pa-cat-card__date">
        <i class="ri-calendar-line"></i>
        <div class="pa-cat-card__date-copy">
          <span class="pa-cat-card__date-label">${safeDateLabel}</span>
          <span class="pa-cat-card__date-value">${safeDateValue}</span>
        </div>
      </div>
      <div class="pa-cat-card__list-actions">
        <button type="button" class="pa-action-btn pa-action-edit" ${idAttr}="${safeId}" title="Edit" aria-label="Edit ${safeTitle}"><i class="ri-pencil-line"></i></button>
        <button type="button" class="pa-action-btn pa-action-delete" ${idAttr}="${safeId}" title="Delete" aria-label="Delete ${safeTitle}"><i class="ri-delete-bin-line"></i></button>
        <button type="button" class="pa-action-btn pa-action-more" ${idAttr}="${safeId}" title="More options" aria-label="More options for ${safeTitle}"><i class="ri-more-2-fill"></i></button>
        ${menuHtml}
      </div>
      ${chevronHtml}
    </div>
  </div>`;
}
function renderPaCatListRow(opts) {
  const {
    rowIndex,
    idAttr,
    id,
    iconHtml,
    title,
    category = "\u2014",
    status = "Active",
    created = "\u2014",
    cardClass = "",
    viewBtnHtml = ""
  } = opts;
  return `${renderListRowStart(cardClass)}
    ${renderListIndexCell(rowIndex)}
    ${renderListIconProjectCell(title, iconHtml)}
    ${renderListTextCell(category)}
    ${renderListStatusCell(status)}
    ${renderListDateCell(created)}
    ${renderListEditDeleteActions({ idAttr, id, title, extraHtml: viewBtnHtml })}
  ${closeListRow()}`;
}
function attachPaCatCardViewListeners(grid, idAttr, onView) {
  if (!grid || !onView) return;
  grid.querySelectorAll(".pa-cat-card__view-btn, .pa-cat-card__chevron").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const id = btn.getAttribute(idAttr);
      if (id != null && id !== "") onView(id);
    });
  });
}
export {
  attachPaCatCardViewListeners,
  renderPaCatCard,
  renderPaCatCardViewBtn,
  renderPaCatListRow
};
