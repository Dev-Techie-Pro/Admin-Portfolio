import { getEngagementStats } from '@/lib/cms/blog-engagement';
import { withEditorGet } from '@/lib/api/with-editor-get';

export async function GET() {
  return withEditorGet(() => getEngagementStats(), { maxAgeSec: 15 });
}
