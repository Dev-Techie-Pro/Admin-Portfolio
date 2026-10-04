/** Detect PostgREST/DB errors when projects.category_keys is not migrated yet. */
export function isProjectCategoryKeysUnavailable(error: unknown): boolean {
  const msg = String(
    (error as { message?: string })?.message
    || (error as { details?: string })?.details
    || (error as { hint?: string })?.hint
    || error
    || '',
  ).toLowerCase();
  return msg.includes('category_keys');
}

/** Detect PostgREST/DB errors when project_tool_links is not migrated yet. */
export function isProjectToolLinksUnavailable(error: unknown): boolean {
  const msg = String(
    (error as { message?: string })?.message
    || (error as { details?: string })?.details
    || error
    || '',
  ).toLowerCase();
  return msg.includes('project_tool_links');
}

let toolLinksTableCached: boolean | null = null;

/** Whether project_tool_links exists and is queryable (cached for the process). */
export async function projectToolLinksTableAvailable(
  sb: { from: (table: string) => { select: (cols: string) => { limit: (n: number) => Promise<{ error: unknown }> } } },
): Promise<boolean> {
  if (toolLinksTableCached !== null) return toolLinksTableCached;
  const { error } = await sb.from('project_tool_links').select('id').limit(1);
  if (error && isProjectToolLinksUnavailable(error)) {
    toolLinksTableCached = false;
    return false;
  }
  toolLinksTableCached = !error;
  return toolLinksTableCached;
}
