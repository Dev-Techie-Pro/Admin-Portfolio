// @ts-nocheck
import { guardEditor } from '@/lib/auth/guard';
import { jsonGet, jsonGetCached } from '@/lib/api/json-response';

/** GET handler — editor+ only (super_admin, admin, editor). */
export async function withEditorGet(handler, { maxAgeSec = 0 } = {}) {
  const auth = await guardEditor();
  if (!auth.ok) return auth.response;

  try {
    const data = await handler(auth);
    if (maxAgeSec > 0) return jsonGetCached(data, maxAgeSec);
    return jsonGet(data);
  } catch (error) {
    const status = error?.status || 500;
    return jsonGet({ error: error.message }, { status });
  }
}
