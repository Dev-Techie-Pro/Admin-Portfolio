import { createAdminClient } from '@/lib/supabase/admin';
import { warmRuntimeSettings, getRuntimeSettingSync } from '@/lib/config/runtime-settings';

export type OpsReadinessReport = {
  migrationPublicApiHardening: boolean;
  cronSecretConfigured: boolean;
  portfolioOriginsConfigured: boolean;
  previewTokenSecretConfigured: boolean;
  turnstileConfigured: boolean;
  warnings: string[];
};

export async function getOpsReadinessReport(): Promise<OpsReadinessReport> {
  const warnings: string[] = [];
  let migrationPublicApiHardening = false;

  try {
    const sb = createAdminClient();
    const { error: tableError } = await sb.from('api_rate_limits').select('bucket').limit(1);
    if (!tableError) {
      const { error: rpcError } = await sb.rpc('pa_rate_limit_allow', {
        p_bucket: 'ops-probe',
        p_window_seconds: 60,
        p_max_hits: 5,
      });
      migrationPublicApiHardening = !rpcError;
      if (rpcError) warnings.push('pa_rate_limit_allow RPC is missing or failed.');
    } else {
      warnings.push('api_rate_limits table is missing — apply migration 20261005120000_public_api_hardening.sql.');
    }
  } catch {
    warnings.push('Could not verify database migration state.');
  }

  const cronSecretConfigured = Boolean(process.env.CRON_SECRET?.trim());
  if (process.env.NODE_ENV === 'production' && !cronSecretConfigured) {
    warnings.push('CRON_SECRET is not set (required in production for /api/cron/*).');
  }

  const originsRaw = process.env.PORTFOLIO_PUBLIC_ORIGINS?.trim()
    || process.env.NEXT_PUBLIC_PORTFOLIO_URL?.trim()
    || '';
  const portfolioOriginsConfigured = Boolean(originsRaw);
  if (process.env.NODE_ENV === 'production' && !portfolioOriginsConfigured) {
    warnings.push('PORTFOLIO_PUBLIC_ORIGINS (or NEXT_PUBLIC_PORTFOLIO_URL) is not set for public CORS.');
  }

  if (!migrationPublicApiHardening) {
    warnings.push('Disable direct anon inserts to contact_messages after migration (use /api/public/contact).');
  }

  warnings.push(
    'Confirm Supabase Auth → Email → “Enable sign ups” is OFF for invite-only staff access.',
  );

  const previewTokenSecretConfigured = Boolean(
    process.env.PREVIEW_TOKEN_SECRET?.trim() || process.env.CRON_SECRET?.trim(),
  );
  if (process.env.NODE_ENV === 'production' && !previewTokenSecretConfigured) {
    warnings.push('PREVIEW_TOKEN_SECRET (or CRON_SECRET) is not set for draft preview tokens.');
  }

  await warmRuntimeSettings();
  const turnstileConfigured = Boolean(
    getRuntimeSettingSync('TURNSTILE_SITE_KEY')?.trim()
    && getRuntimeSettingSync('TURNSTILE_SECRET_KEY')?.trim(),
  );
  if (process.env.NODE_ENV === 'production' && !turnstileConfigured) {
    warnings.push('Turnstile keys are not set in System → Environment (recommended for public forms).');
  }

  return {
    migrationPublicApiHardening,
    cronSecretConfigured,
    portfolioOriginsConfigured,
    previewTokenSecretConfigured,
    turnstileConfigured,
    warnings,
  };
}
