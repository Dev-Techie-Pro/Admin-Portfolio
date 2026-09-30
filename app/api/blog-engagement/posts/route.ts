import { listPostsLikeSummary } from '@/lib/cms/blog-engagement';
import { withEditorGet } from '@/lib/api/with-editor-get';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const limit = Number.parseInt(searchParams.get('limit') || '50', 10);
  const offset = Number.parseInt(searchParams.get('offset') || '0', 10);
  return withEditorGet(() => listPostsLikeSummary({ limit, offset }), { maxAgeSec: 30 });
}
