const CATEGORY_META_PROJECTS = {
  enterprise: { label: "Enterprise Platform", cls: "pa-cat-enterprise" },
  educational: { label: "Educational Platform", cls: "pa-cat-educational" },
  desktop: { label: "Desktop Application", cls: "pa-cat-desktop" },
  medical: { label: "Medical System", cls: "pa-cat-medical" },
  ecommerce: { label: "E-Commerce", cls: "pa-cat-ecommerce" },
  travel: { label: "Travel Platform", cls: "pa-cat-travel" },
  web: { label: "Web Application", cls: "pa-cat-web" },
  nonprofit: { label: "Non Profit Organization", cls: "pa-cat-nonprofit" }
};
function projectCatKeys(project) {
  if (!project) return [];
  if (Array.isArray(project.catKeys) && project.catKeys.length) {
    return project.catKeys.map((k) => String(k).trim()).filter(Boolean);
  }
  const single = project.catKey ? String(project.catKey).trim() : "";
  return single ? [single] : [];
}
function primaryProjectCatKey(project) {
  const keys = projectCatKeys(project);
  return keys[0] || "";
}
function withNormalizedProjectCategories(project) {
  const catKeys = projectCatKeys(project);
  const catKey = catKeys[0] || String(project.catKey || "");
  return { ...project, catKeys, catKey };
}
function projectMatchesCategoryFilter(project, filter) {
  if (!filter || filter === "all") return true;
  return projectCatKeys(project).includes(filter);
}
function projectCategoryLabels(project, meta) {
  return projectCatKeys(project).map((k) => meta[k]?.label || k).filter(Boolean).join(" \xB7 ");
}
export {
  CATEGORY_META_PROJECTS,
  primaryProjectCatKey,
  projectCatKeys,
  projectCategoryLabels,
  projectMatchesCategoryFilter,
  withNormalizedProjectCategories
};
