// @ts-nocheck
export type PageHeaderMeta = {
  title: string;
  subtitle: string;
};

/** Replace the first page title block in legacy body HTML (shared templates per route). */
export function injectPageHeaderMeta(html: string, meta: PageHeaderMeta): string {
  return html
    .replace(
      /<div class="pa-page-title">[\s\S]*?<\/div>/,
      `<div class="pa-page-title">${meta.title}</div>`,
    )
    .replace(
      /<div class="pa-page-subtitle">[\s\S]*?<\/div>/,
      `<div class="pa-page-subtitle">${meta.subtitle}</div>`,
    );
}
