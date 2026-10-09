// @ts-nocheck
import { NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { guardAal2 } from '@/lib/auth/guard';
import { createAdminClient } from '@/lib/supabase/admin';
import { clearUserBackupCodes } from '@/lib/auth/backup-codes';
import { listTotpFactors, unenrollTotpFactor } from '@/lib/auth/mfa';
import { recordUserAction } from '@/lib/cms/activity-log';
import { countActiveSuperAdmins } from '@/lib/auth/users';
import { getRequestStaffProfile } from '@/lib/auth/request-cache';
import { jsonInternalError } from '@/lib/api/api-error';

export async function POST(request) {
  const auth = await guardAal2();
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();
    const currentPassword = body?.currentPassword;
    const confirmText = String(body?.confirmText || '').trim();

    if (!currentPassword) {
      return NextResponse.json({ error: 'Current password is required.' }, { status: 400 });
    }
    if (confirmText !== 'DELETE') {
      return NextResponse.json({ error: 'Type DELETE to confirm account deletion.' }, { status: 400 });
    }

    const profile = await getRequestStaffProfile(auth.user.id);
    if (profile?.role === 'super_admin') {
      const superCount = await countActiveSuperAdmins();
      if (superCount <= 1) {
        return NextResponse.json(
          { error: 'Cannot delete the last active super admin account.' },
          { status: 403 },
        );
      }
    }

    const verifyOnly = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
    const { error: verifyError } = await verifyOnly.auth.signInWithPassword({
      email: auth.user.email,
      password: currentPassword,
    });
    if (verifyError) {
      return NextResponse.json({ error: 'Current password is incorrect.' }, { status: 401 });
    }

    await recordUserAction({
      userId: auth.user.id,
      actionTitle: 'Account deleted',
      actionDescription: `${auth.user.email || 'User'} deleted their account.`,
      status: 'warning',
      metadata: { action: 'user.deleted', email: auth.user.email },
      request,
    });

    try {
      const { verified } = await listTotpFactors(auth.supabase);
      if (verified?.id) await unenrollTotpFactor(auth.supabase, verified.id);
    } catch {
      // non-fatal
    }
    await clearUserBackupCodes(auth.user.id);

    const admin = createAdminClient();
    const { error: deleteError } = await admin.auth.admin.deleteUser(auth.user.id);
    if (deleteError) throw deleteError;

    const supabase = auth.supabase;
    await supabase.auth.signOut();

    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonInternalError('auth/delete-account', error);
  }
}
