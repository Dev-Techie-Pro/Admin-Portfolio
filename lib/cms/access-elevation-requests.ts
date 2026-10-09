// @ts-nocheck
import { createAdminClient } from '@/lib/supabase/admin';
import { SITE_ID } from './constants';
import {
  elevationExpiresAtFromHours,
  isElevationActive,
  normalizeDurationHours,
  staffAlreadyHasEditorAccess,
} from '@/lib/auth/elevation';
import {
  ACCESS_ELEVATION_ROLE_DURATION_MIGRATION_MESSAGE,
  ACCESS_ELEVATION_TABLE_MISSING_MESSAGE,
  isAccessElevationColumnMissing,
  isAccessElevationSchemaError,
  isAccessElevationTableMissing,
} from '@/lib/auth/access-elevation-db';

function admin() {
  return createAdminClient();
}

const BASE_REQUEST_COLUMNS = `
  id,
  site_id,
  user_id,
  contact_email,
  message,
  status,
  created_at,
  reviewed_by,
  reviewed_at,
  rejection_note,
  elevated_until
`;

const REQUEST_COLUMNS = BASE_REQUEST_COLUMNS;

export function mapAccessRequestRow(row, profile?) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    contactEmail: row.contact_email,
    message: row.message,
    status: row.status,
    createdAt: row.created_at,
    reviewedBy: row.reviewed_by,
    reviewedAt: row.reviewed_at,
    rejectionNote: row.rejection_note,
    elevatedUntil: row.elevated_until,
    durationHours: row.duration_hours ?? null,
    roleBeforeElevation: row.role_before_elevation ?? null,
    requesterName: profile?.full_name || profile?.username || profile?.email || '',
    requesterEmail: profile?.email || '',
    requesterRole: profile?.role || 'viewer',
  };
}

export async function getPendingRequestForUser(userId: string) {
  const { data, error } = await admin()
    .from('access_elevation_requests')
    .select(REQUEST_COLUMNS)
    .eq('user_id', userId)
    .eq('status', 'pending')
    .maybeSingle();
  if (error) {
    if (isAccessElevationSchemaError(error)) return null;
    throw error;
  }
  return data;
}

export async function getStaffElevationStatus(userId: string) {
  let pending = null;
  try {
    pending = await getPendingRequestForUser(userId);
  } catch (error) {
    if (!isAccessElevationSchemaError(error)) throw error;
    return { pending: null, activeUntil: null, canRequest: false, setupRequired: true };
  }

  const { data: activeRow, error } = await admin()
    .from('access_elevation_requests')
    .select('elevated_until')
    .eq('user_id', userId)
    .eq('status', 'approved')
    .gt('elevated_until', new Date().toISOString())
    .order('elevated_until', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) {
    if (isAccessElevationTableMissing(error)) {
      return { pending: null, activeUntil: null, canRequest: false, setupRequired: true };
    }
    throw error;
  }
  const activeUntil = activeRow?.elevated_until ?? null;
  return {
    pending: pending ? mapAccessRequestRow(pending) : null,
    activeUntil,
    canRequest: !pending && !isElevationActive(activeUntil),
  };
}

export async function createAccessElevationRequest({
  userId,
  siteId,
  contactEmail,
  message,
}: {
  userId: string;
  siteId?: string;
  contactEmail: string;
  message: string;
}) {
  const { data, error } = await admin()
    .from('access_elevation_requests')
    .insert({
      site_id: siteId || SITE_ID,
      user_id: userId,
      contact_email: contactEmail,
      message,
      status: 'pending',
    })
    .select(REQUEST_COLUMNS)
    .single();
  if (error) {
    if (isAccessElevationTableMissing(error)) {
      throw Object.assign(new Error(ACCESS_ELEVATION_TABLE_MISSING_MESSAGE), { status: 503 });
    }
    if (isAccessElevationColumnMissing(error)) {
      throw Object.assign(new Error(ACCESS_ELEVATION_ROLE_DURATION_MIGRATION_MESSAGE), { status: 503 });
    }
    if (error.code === '23505') {
      throw Object.assign(new Error('You already have a pending access request.'), { status: 409 });
    }
    throw error;
  }
  return data;
}

export async function listAccessRequestsForAdmin({
  limit = 50,
  status,
}: { limit?: number; status?: string } = {}) {
  let query = admin()
    .from('access_elevation_requests')
    .select(REQUEST_COLUMNS)
    .order('created_at', { ascending: false })
    .limit(Math.min(limit, 100));

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;
  if (error) {
    if (isAccessElevationSchemaError(error)) {
      const message = isAccessElevationColumnMissing(error)
        ? ACCESS_ELEVATION_ROLE_DURATION_MIGRATION_MESSAGE
        : ACCESS_ELEVATION_TABLE_MISSING_MESSAGE;
      throw Object.assign(new Error(message), { status: 503 });
    }
    throw error;
  }
  if (!data?.length) return [];

  const userIds = [...new Set(data.map((r) => r.user_id))];
  const { data: profiles, error: profileError } = await admin()
    .from('profiles')
    .select('id, full_name, username, email, role')
    .in('id', userIds);
  if (profileError) throw profileError;
  const profileMap = new Map((profiles || []).map((p) => [p.id, p]));

  return data.map((row) => mapAccessRequestRow(row, profileMap.get(row.user_id)));
}

export async function getAccessRequestById(id: string) {
  const { data, error } = await admin()
    .from('access_elevation_requests')
    .select(REQUEST_COLUMNS)
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const { data: profile } = await admin()
    .from('profiles')
    .select('id, full_name, username, email, role')
    .eq('id', data.user_id)
    .maybeSingle();
  return mapAccessRequestRow(data, profile);
}

export async function approveAccessRequest(
  id: string,
  reviewerId: string,
  durationHoursInput?: number,
) {
  const row = await getAccessRequestById(id);
  if (!row) throw Object.assign(new Error('Request not found.'), { status: 404 });
  if (row.status !== 'pending') {
    throw Object.assign(new Error('This request has already been reviewed.'), { status: 400 });
  }

  const { data: requesterProfile, error: profileFetchError } = await admin()
    .from('profiles')
    .select('id, full_name, username, email, role')
    .eq('id', row.userId)
    .maybeSingle();
  if (profileFetchError) throw profileFetchError;

  const requesterRole = requesterProfile?.role ?? row.requesterRole ?? 'viewer';
  if (staffAlreadyHasEditorAccess(requesterRole)) {
    throw Object.assign(
      new Error('This user already has editor-level access; approval is only for viewers.'),
      { status: 400 },
    );
  }
  if (requesterRole !== 'viewer') {
    throw Object.assign(
      new Error('Only viewer accounts can receive temporary editor access.'),
      { status: 400 },
    );
  }

  const durationHours = normalizeDurationHours(durationHoursInput);
  const reviewedAt = new Date().toISOString();
  const elevatedUntil = elevationExpiresAtFromHours(durationHours);

  const baseApprove = {
    status: 'approved',
    reviewed_by: reviewerId,
    reviewed_at: reviewedAt,
    elevated_until: elevatedUntil,
  };

  let data;
  let error;
  ({ data, error } = await admin()
    .from('access_elevation_requests')
    .update({
      ...baseApprove,
      duration_hours: durationHours,
      role_before_elevation: requesterRole,
      role_restored_at: null,
    })
    .eq('id', id)
    .eq('status', 'pending')
    .select(BASE_REQUEST_COLUMNS)
    .single());

  if (error && isAccessElevationColumnMissing(error)) {
    ({ data, error } = await admin()
      .from('access_elevation_requests')
      .update(baseApprove)
      .eq('id', id)
      .eq('status', 'pending')
      .select(BASE_REQUEST_COLUMNS)
      .single());
  }

  if (error) {
    if (isAccessElevationSchemaError(error)) {
      const message = isAccessElevationColumnMissing(error)
        ? ACCESS_ELEVATION_ROLE_DURATION_MIGRATION_MESSAGE
        : ACCESS_ELEVATION_TABLE_MISSING_MESSAGE;
      throw Object.assign(new Error(message), { status: 503 });
    }
    throw error;
  }

  const { error: roleUpdateError } = await admin()
    .from('profiles')
    .update({ role: 'editor' })
    .eq('id', data.user_id)
    .eq('role', 'viewer');
  if (roleUpdateError) throw roleUpdateError;

  const { data: profile } = await admin()
    .from('profiles')
    .select('id, full_name, username, email, role')
    .eq('id', data.user_id)
    .maybeSingle();

  return mapAccessRequestRow(data, profile);
}

export async function rejectAccessRequest(id: string, reviewerId: string, rejectionNote?: string) {
  const row = await getAccessRequestById(id);
  if (!row) throw Object.assign(new Error('Request not found.'), { status: 404 });
  if (row.status !== 'pending') {
    throw Object.assign(new Error('This request has already been reviewed.'), { status: 400 });
  }

  const { data, error } = await admin()
    .from('access_elevation_requests')
    .update({
      status: 'rejected',
      reviewed_by: reviewerId,
      reviewed_at: new Date().toISOString(),
      rejection_note: rejectionNote?.trim() || null,
    })
    .eq('id', id)
    .eq('status', 'pending')
    .select(REQUEST_COLUMNS)
    .single();
  if (error) throw error;

  const { data: profile } = await admin()
    .from('profiles')
    .select('id, full_name, username, email, role')
    .eq('id', data.user_id)
    .maybeSingle();

  return mapAccessRequestRow(data, profile);
}
