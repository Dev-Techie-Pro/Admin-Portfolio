import { guardAdmin } from '@/lib/auth/guard';
import { jsonOk } from '@/lib/api/json-response';
import { getRuntimeConfigForApi, importRuntimeConfigFromEnv } from '@/lib/config/runtime-settings';
import { recordUserAction } from '@/lib/cms/activity-log';

export async function POST(request) {
  const auth = await guardAdmin();
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json().catch(() => ({}));
    const onlyIfEmpty = body?.onlyIfEmpty !== false;
    const result = await importRuntimeConfigFromEnv(auth.user.id, { onlyIfEmpty });
    const config = await getRuntimeConfigForApi();

    if (result.imported) {
      await recordUserAction({
        userId: auth.user.id,
        actionTitle: 'Runtime settings imported',
        actionDescription: 'Imported runtime settings from environment files into the database',
        status: 'success',
        metadata: { action: 'runtime_settings.imported', keys: result.keys },
        request,
      });
    }

    return jsonOk({
      ok: true,
      ...result,
      ...config,
      message: result.imported
        ? (result.reason || `Imported ${result.keys?.length || 0} setting(s) from env file(s).`)
        : (result.reason || 'Nothing to import.'),
    });
  } catch (error) {
    return jsonOk({ error: error.message || 'Import failed.' }, { status: 500 });
  }
}
