import { guardAdmin } from '@/lib/auth/guard';
import { jsonGet, jsonOk } from '@/lib/api/json-response';
import {
  getRuntimeConfigForApi,
  importRuntimeConfigFromEnv,
  saveRuntimeConfig,
} from '@/lib/config/runtime-settings';
import { recordUserAction } from '@/lib/cms/activity-log';

export async function GET() {
  const auth = await guardAdmin();
  if (!auth.ok) return auth.response;

  try {
    let config = await getRuntimeConfigForApi();
    const hasAny = Object.values(config.configured || {}).some(Boolean);
    if (!hasAny) {
      await importRuntimeConfigFromEnv(auth.user.id, { onlyIfEmpty: true });
      config = await getRuntimeConfigForApi();
    }
    return jsonGet(config);
  } catch (error) {
    return jsonOk({ error: error.message || 'Could not load environment configuration.' }, { status: 500 });
  }
}

export async function PUT(request) {
  const auth = await guardAdmin();
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();
    await saveRuntimeConfig(body?.values || body || {}, auth.user.id);

    await recordUserAction({
      userId: auth.user.id,
      actionTitle: 'Runtime settings updated',
      actionDescription: 'System environment settings were saved to the database',
      status: 'success',
      metadata: { action: 'runtime_settings.updated' },
      request,
    });

    const config = await getRuntimeConfigForApi();
    return jsonOk({
      ok: true,
      message: 'Settings saved. Changes apply immediately for new requests.',
      ...config,
    });
  } catch (error) {
    const status = error.validationErrors?.length ? 400 : 500;
    return jsonOk(
      {
        error: error.message || 'Could not save environment configuration.',
        validationErrors: error.validationErrors || undefined,
      },
      { status },
    );
  }
}
