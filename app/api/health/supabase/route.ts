// @ts-nocheck
import { createAdminClient } from '@/lib/supabase/admin';
import { getDashboardStats } from '@/lib/cms/dashboard-stats';
import { guardStaff, isGuardFailure } from '@/lib/auth/guard';
import { getOpsReadinessReport } from '@/lib/cms/ops-readiness';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const supabase = createAdminClient();
    const url = new URL(request.url);
    const fresh = url.searchParams.get('fresh') === '1';
    const detailed = url.searchParams.get('detailed') === '1';

    const { data: site, error: siteError } = await supabase
      .from('sites')
      .select('id, slug, name')
      .eq('slug', 'default')
      .maybeSingle();

    if (siteError) throw siteError;

    const base = {
      ok: true,
      connected: true,
      site: site ? { slug: site.slug, name: site.name } : null,
    };

    if (!detailed) {
      return NextResponse.json(base);
    }

    const auth = await guardStaff();
    if (isGuardFailure(auth)) {
      return auth.response;
    }

    const [stats, ops] = await Promise.all([
      getDashboardStats({ fresh }),
      getOpsReadinessReport(),
    ]);
    return NextResponse.json({ ...base, stats, ops });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        connected: false,
        error: 'Supabase connection failed',
      },
      { status: 500 },
    );
  }
}
