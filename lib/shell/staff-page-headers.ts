// @ts-nocheck
import type { PageHeaderMeta } from './inject-page-header';

export const STAFF_PAGE_HEADERS = {
  projectCategories: {
    title: 'Project Categories',
    subtitle: 'Manage project category definitions used in filters and cards',
  },
  projectTags: {
    title: 'Project Tags',
    subtitle: 'Manage tags assigned to projects for filtering and discovery',
  },
  toolCategories: {
    title: 'Tool Categories',
    subtitle: 'Organize tools with categories, proficiency levels, and accent colors',
  },
  tools: {
    title: 'Tools',
    subtitle: 'Manage individual tools and assign them to categories',
  },
  blogCategories: {
    title: 'Blog Categories',
    subtitle: 'Manage post category definitions for your blog',
  },
  blogTags: {
    title: 'Blog Tags',
    subtitle: 'Manage tags used on blog posts',
  },
} satisfies Record<string, PageHeaderMeta>;
