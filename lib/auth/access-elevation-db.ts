/** PostgREST / Postgres errors when `access_elevation_requests` is not migrated yet. */
export function isAccessElevationTableMissing(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const code = (error as { code?: string }).code;
  return code === 'PGRST205' || code === '42P01';
}

/** Column missing (e.g. role duration migration not applied yet). */
export function isAccessElevationColumnMissing(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const code = (error as { code?: string }).code;
  return code === '42703';
}

export function isAccessElevationSchemaError(error: unknown): boolean {
  return isAccessElevationTableMissing(error) || isAccessElevationColumnMissing(error);
}

export const ACCESS_ELEVATION_TABLE_MISSING_MESSAGE =
  'Access elevation is not set up yet. Apply the database baseline (supabase/migrations/20261011120000_portfolio_admin_baseline.sql), e.g. run npm run db:push.';

export const ACCESS_ELEVATION_ROLE_DURATION_MIGRATION_MESSAGE =
  'Temporary editor role requires the portfolio admin baseline migration (20261011120000). Run: npm run db:push';
