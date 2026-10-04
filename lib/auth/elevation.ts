import { cache } from 'react';

import { createAdminClient } from '@/lib/supabase/admin';

import {

  ADMIN_ROLES,

  ELEVATION_DEFAULT_HOURS,

  ELEVATION_MAX_HOURS,

} from './constants';

import { deriveAccessCapabilities, type AccessCapabilities } from './capabilities';

import { isAccessElevationColumnMissing, isAccessElevationTableMissing } from './access-elevation-db';



function admin() {

  return createAdminClient();

}



export const getActiveElevationUntil = cache(async (userId: string): Promise<string | null> => {

  const { data, error } = await admin()

    .from('access_elevation_requests')

    .select('elevated_until')

    .eq('user_id', userId)

    .eq('status', 'approved')

    .gt('elevated_until', new Date().toISOString())

    .order('elevated_until', { ascending: false })

    .limit(1)

    .maybeSingle();

  if (error) {

    if (isAccessElevationTableMissing(error)) return null;

    throw error;

  }

  if (!data?.elevated_until) return null;

  return data.elevated_until;

});



export function isElevationActive(elevatedUntil: string | null | undefined): boolean {

  if (!elevatedUntil) return false;

  return new Date(elevatedUntil).getTime() > Date.now();

}



export function getStaffCapabilities(

  role: string | null | undefined,

  elevatedUntil: string | null | undefined,

): AccessCapabilities {

  return deriveAccessCapabilities(role, elevatedUntil);

}



export function normalizeDurationHours(input: unknown): number {
  if (input === undefined || input === null || input === '') {
    return ELEVATION_DEFAULT_HOURS;
  }
  const n = typeof input === 'number' ? input : parseInt(String(input), 10);

  if (!Number.isFinite(n) || n < 1 || n > ELEVATION_MAX_HOURS) {

    throw Object.assign(

      new Error(`Duration must be between 1 and ${ELEVATION_MAX_HOURS} hours.`),

      { status: 400 },

    );

  }

  return Math.floor(n);

}



export function elevationExpiresAtFromHours(hours?: number): string {

  const h = hours ?? ELEVATION_DEFAULT_HOURS;

  return new Date(Date.now() + h * 60 * 60 * 1000).toISOString();

}



/** @deprecated Use elevationExpiresAtFromHours */

export function elevationExpiresAtFromNow(): string {

  return elevationExpiresAtFromHours(ELEVATION_DEFAULT_HOURS);

}



export function staffAlreadyHasEditorAccess(role: string | null | undefined): boolean {

  const normalized = typeof role === 'string' ? role : 'viewer';

  return ADMIN_ROLES.includes(normalized) || normalized === 'editor';

}



/**

 * Revert temporary editor role when elevation has expired (lazy, on auth reads).

 */

export async function reconcileExpiredElevation(userId: string): Promise<void> {

  const activeUntil = await getActiveElevationUntil(userId);

  if (activeUntil) return;



  const { data: expiredRow, error } = await admin()

    .from('access_elevation_requests')

    .select('id, role_before_elevation, elevated_until, role_restored_at')

    .eq('user_id', userId)

    .eq('status', 'approved')

    .not('role_before_elevation', 'is', null)

    .is('role_restored_at', null)

    .lte('elevated_until', new Date().toISOString())

    .order('elevated_until', { ascending: false })

    .limit(1)

    .maybeSingle();



  if (error) {
    if (isAccessElevationTableMissing(error) || isAccessElevationColumnMissing(error)) return;
    throw error;
  }

  if (!expiredRow?.id) return;



  const roleBefore = expiredRow.role_before_elevation;

  const { data: profile, error: profileError } = await admin()

    .from('profiles')

    .select('role')

    .eq('id', userId)

    .maybeSingle();

  if (profileError) throw profileError;



  const currentRole = profile?.role ?? 'viewer';

  const shouldRevert =

    roleBefore === 'viewer' && currentRole === 'editor';



  if (shouldRevert) {

    const { error: updateProfileError } = await admin()

      .from('profiles')

      .update({ role: roleBefore })

      .eq('id', userId);

    if (updateProfileError) throw updateProfileError;

  }



  const { error: markError } = await admin()

    .from('access_elevation_requests')

    .update({ role_restored_at: new Date().toISOString() })

    .eq('id', expiredRow.id);

  if (markError) {
    if (isAccessElevationColumnMissing(markError)) return;
    throw markError;
  }
}


