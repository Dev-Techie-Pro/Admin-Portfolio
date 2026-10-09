import { guardAal2, guardSuperAdmin } from '@/lib/auth/guard';
import { jsonOk } from '@/lib/api/json-response';
import {
  getRuntimeConfigForApi,
  importRuntimeConfigFromEnvContent,
} from '@/lib/config/runtime-settings';
import { recordUserAction } from '@/lib/cms/activity-log';

const MAX_ENV_IMPORT_BYTES = 256 * 1024;

type ImportPayloadResult =
  | { error: string }
  | { content: string; fileName: string; onlyIfEmpty: boolean };

async function readImportPayload(request: Request): Promise<ImportPayloadResult> {
  const contentType = request.headers.get('content-type') || '';

  if (contentType.includes('multipart/form-data')) {
    const form = await request.formData();
    const file = form.get('file');
    if (!(file instanceof File)) {
      return { error: 'Choose an env file to upload.' };
    }
    if (file.size > MAX_ENV_IMPORT_BYTES) {
      return { error: 'Env file is too large (max 256 KB).' };
    }
    const content = await file.text();
    const onlyIfEmpty = String(form.get('onlyIfEmpty') ?? 'false') === 'true';
    return { content, fileName: file.name || 'uploaded file', onlyIfEmpty };
  }

  const body = await request.json().catch(() => ({}));
  const content = body?.content;
  if (content == null || content === '') {
    return { error: 'Upload an env file or send file content in the request body.' };
  }
  const text = String(content);
  if (text.length > MAX_ENV_IMPORT_BYTES) {
    return { error: 'Env file is too large (max 256 KB).' };
  }
  return {
    content: text,
    fileName: String(body?.fileName || 'uploaded file'),
    onlyIfEmpty: body?.onlyIfEmpty === true,
  };
}

export async function POST(request: Request) {
  const auth = await guardSuperAdmin();
  if (!auth.ok) return auth.response;
  const aal = await guardAal2();
  if (!aal.ok) return aal.response;

  try {
    const payload = await readImportPayload(request);
    if ('error' in payload) {
      return jsonOk({ error: payload.error }, { status: 400 });
    }

    const { content, fileName, onlyIfEmpty } = payload;
    const result = await importRuntimeConfigFromEnvContent(auth.user.id, content, {
      onlyIfEmpty,
      fileName,
    });
    const config = await getRuntimeConfigForApi();

    if (result.imported) {
      await recordUserAction({
        userId: auth.user.id,
        actionTitle: 'Runtime settings imported',
        actionDescription: `Imported runtime settings from uploaded file (${fileName})`,
        status: 'success',
        metadata: { action: 'runtime_settings.imported', keys: result.keys, fileName },
        request,
      });
    }

    return jsonOk({
      ok: true,
      ...result,
      ...config,
      message: result.imported
        ? (result.reason || `Imported ${result.keys?.length || 0} setting(s).`)
        : (result.reason || 'Nothing to import.'),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Import failed.';
    return jsonOk({ error: message }, { status: 500 });
  }
}
