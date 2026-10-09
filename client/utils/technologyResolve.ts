// @ts-nocheck
import { storage } from '../core/StorageService.js';
import { defaultTechnologyCategoryId, loadToolCategories } from './technologyCategorySelect.js';

export type ResolvedTechnology = {
  id: number;
  name: string;
  categoryId?: number;
  level?: string;
  url?: string;
  desc?: string;
  years?: number | null;
  featured?: boolean;
  sortOrder?: number;
  createdAt?: string;
};

/**
 * Find or create a technology by name (persisted to Technologies).
 * Category is optional on create — server assigns default; user can change it on the Technologies page.
 */
export async function resolveTechnologyByName(name: string): Promise<ResolvedTechnology | null> {
  const trimmed = String(name || '').trim();
  if (!trimmed) return null;

  storage.invalidate('pa_technologies');
  let techs = await storage.get('pa_technologies', []);
  if (!Array.isArray(techs)) techs = [];

  const hit = techs.find((t) => String(t.name || '').toLowerCase() === trimmed.toLowerCase());
  if (hit) return hit;

  const categories = await loadToolCategories();
  const defaultCat = defaultTechnologyCategoryId(categories);

  const newId = Math.max(0, ...techs.map((t) => Number(t.id) || 0)) + 1;
  const newTech: ResolvedTechnology = {
    id: newId,
    name: trimmed,
    level: 'intermediate',
    url: '',
    desc: '',
    years: null,
    featured: false,
    sortOrder: newId,
    createdAt: new Date().toISOString(),
  };
  if (defaultCat != null) {
    newTech.categoryId = defaultCat;
  }

  await storage.set('pa_technologies', techs.concat(newTech));
  storage.invalidate('pa_recent_activities');
  return newTech;
}
