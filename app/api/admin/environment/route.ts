import { guardAal2, guardSuperAdmin } from '@/lib/auth/guard';
import { jsonGet, jsonOk } from '@/lib/api/json-response';
import { getRuntimeConfigForApi, saveRuntimeConfig } from '@/lib/config/runtime-settings';
import { recordUserAction } from '@/lib/cms/activity-log';

export async function GET() {
  const auth = await guardSuperAdmin();
  if (!auth.ok) return auth.response;

  try {
    const config = await getRuntimeConfigForApi();
    return jsonGet(config);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not load environment configuration.';
    return jsonOk({ error: message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const auth = await guardSuperAdmin();
  if (!auth.ok) return auth.response;
  const aal = await guardAal2();
  if (!aal.ok) return aal.response;

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
    const err = error as Error & { validationErrors?: unknown[] };
    const status = err.validationErrors?.length ? 400 : 500;
    return jsonOk(
      {
        error: err.message || 'Could not save environment configuration.',
        validationErrors: err.validationErrors || undefined,
      },
      { status },
    );
  }
}
