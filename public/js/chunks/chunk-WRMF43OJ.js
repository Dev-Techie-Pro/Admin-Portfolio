import {
  escapeHtml
} from "./chunk-IC6SRMKJ.js";

// client/utils/groupLayout.ts
function arrangeForLayout(items, layoutMode, getGroupInfo) {
  if (layoutMode !== "grouped" || typeof getGroupInfo !== "function") return items;
  const decorated = items.map((item, index) => ({ item, index, info: getGroupInfo(item) || {} }));
  decorated.sort((a, b) => {
    const byTitle = String(a.info.title || "").localeCompare(String(b.info.title || ""), void 0, { sensitivity: "base" });
    if (byTitle !== 0) return byTitle;
    const byKey = String(a.info.key || "").localeCompare(String(b.info.key || ""));
    if (byKey !== 0) return byKey;
    return a.index - b.index;
  });
  return decorated.map((entry) => entry.item);
}
function itemCountLabel(count, singular, plural) {
  const word = count === 1 ? singular : plural;
  return `${count} ${word}`;
}
function renderGroupHeading(group, count, singular, plural) {
  const title = escapeHtml(group.title || "Uncategorized");
  const subtitle = group.subtitle ? `<span class="pa-group-heading__sub">${escapeHtml(group.subtitle)}</span>` : "";
  const action = group.actionHtml || (group.href ? `<a class="pa-group-heading__link" href="${escapeHtml(group.href)}">${escapeHtml(group.linkLabel || "Open")} <i class="ri-arrow-right-line"></i></a>` : "");
  return `<div class="pa-group-heading" data-group-key="${escapeHtml(String(group.key || ""))}">
    <div class="pa-group-heading__main">
      <i class="${escapeHtml(group.icon || "ri-folder-line")}" aria-hidden="true"></i>
      <div class="pa-group-heading__copy">
        <h2 class="pa-group-heading__title">${title}</h2>
        ${subtitle}
      </div>
      <span class="pa-group-heading__count">${escapeHtml(itemCountLabel(count, singular, plural))}</span>
    </div>
    ${action}
  </div>`;
}
function renderGroupedCards(pageItems, allItems, getGroupInfo, renderCard, singular, plural) {
  if (!pageItems.length) return "";
  const countByKey = {};
  allItems.forEach((item) => {
    const key = String(getGroupInfo(item)?.key ?? "");
    countByKey[key] = (countByKey[key] || 0) + 1;
  });
  const groups = [];
  for (const item of pageItems) {
    const info = getGroupInfo(item) || { key: "", title: "Uncategorized" };
    const key = String(info.key ?? "");
    const last = groups[groups.length - 1];
    if (last && last.key === key) {
      last.items.push(item);
    } else {
      groups.push({ ...info, key, items: [item] });
    }
  }
  let cardIndex = 0;
  return groups.map((group) => {
    const heading = renderGroupHeading(group, countByKey[group.key] || group.items.length, singular, plural);
    const cards = group.items.map((item) => renderCard(item, cardIndex++)).join("");
    return `${heading}${cards}`;
  }).join("");
}

export {
  arrangeForLayout,
  renderGroupedCards
};
//# sourceMappingURL=chunk-WRMF43OJ.js.map
