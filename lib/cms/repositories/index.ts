/**
 * Entity repositories (split from lib/cms/repository.tsx over time).
 * Import CMS reads/writes here instead of growing repository.tsx.
 */
export {
  getProjects,
  saveProjects,
  getBlogPosts,
  saveBlogPosts,
  getBlogPostByLegacyId,
} from '@/lib/cms/repository';
