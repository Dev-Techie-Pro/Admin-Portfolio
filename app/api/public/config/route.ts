import { publicCorsJson, publicCorsOptions } from '@/lib/api/public-cors';
import { getPublicTurnstileSiteKey } from '@/lib/api/turnstile';
import { warmRuntimeSettings, getRuntimeSettingSync } from '@/lib/config/runtime-settings';

export async function OPTIONS(request: Request) {
  return publicCorsOptions(request);
}

/** Public integration metadata for companion portfolio sites (no secrets). */
export async function GET(request: Request) {
  try {
    await warmRuntimeSettings();
    const turnstileSiteKey = await getPublicTurnstileSiteKey();
    return publicCorsJson(request, {
      analytics: {
        provider: getRuntimeSettingSync('ANALYTICS_PROVIDER') || null,
        siteId: getRuntimeSettingSync('ANALYTICS_SITE_ID') || null,
      },
      turnstileSiteKey,
      contactApi: '/api/public/contact',
    });
  } catch {
    return publicCorsJson(request, { analytics: { provider: null, siteId: null }, contactApi: '/api/public/contact' });
  }
}
