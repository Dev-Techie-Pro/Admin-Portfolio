export const CATEGORY_META_PROJECTS: Record<string, { label: string; cls: string }> = {
  enterprise: { label: 'Enterprise Platform', cls: 'pa-cat-enterprise' },
  educational: { label: 'Educational Platform', cls: 'pa-cat-educational' },
  desktop: { label: 'Desktop Application', cls: 'pa-cat-desktop' },
  medical: { label: 'Medical System', cls: 'pa-cat-medical' },
  ecommerce: { label: 'E-Commerce', cls: 'pa-cat-ecommerce' },
  travel: { label: 'Travel Platform', cls: 'pa-cat-travel' },
  web: { label: 'Web Application', cls: 'pa-cat-web' },
  nonprofit: { label: 'Non Profit Organization', cls: 'pa-cat-nonprofit' },
};

/** Normalize single vs multi category fields on a project record. */
export function projectCatKeys(project: { catKeys?: string[]; catKey?: string } | null | undefined): string[] {
  if (!project) return [];
  if (Array.isArray(project.catKeys) && project.catKeys.length) {
    return project.catKeys.map((k) => String(k).trim()).filter(Boolean);
  }
  const single = project.catKey ? String(project.catKey).trim() : '';
  return single ? [single] : [];
}

export function primaryProjectCatKey(project: { catKeys?: string[]; catKey?: string } | null | undefined): string {
  const keys = projectCatKeys(project);
  return keys[0] || '';
}

export function withNormalizedProjectCategories<T extends Record<string, unknown>>(project: T): T & { catKeys: string[]; catKey: string } {
  const catKeys = projectCatKeys(project as { catKeys?: string[]; catKey?: string });
  const catKey = catKeys[0] || String((project as { catKey?: string }).catKey || '');
  return { ...project, catKeys, catKey };
}

export function projectMatchesCategoryFilter(
  project: { catKeys?: string[]; catKey?: string },
  filter: string,
): boolean {
  if (!filter || filter === 'all') return true;
  return projectCatKeys(project).includes(filter);
}

export function projectCategoryLabels(
  project: { catKeys?: string[]; catKey?: string },
  meta: Record<string, { label?: string }>,
): string {
  return projectCatKeys(project)
    .map((k) => meta[k]?.label || k)
    .filter(Boolean)
    .join(' · ');
}
