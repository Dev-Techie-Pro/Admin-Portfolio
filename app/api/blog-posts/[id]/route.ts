import { NextResponse } from 'next/server';
import { getBlogPostByLegacyId } from '@/lib/cms/repository';
import { withStaffGet } from '@/lib/api/with-staff-get';
import { guardEditor, isGuardFailure } from '@/lib/auth/guard';
import { blogPostPatchSchema } from '@/lib/schemas/blog-post';
import { patchBlogPostByLegacyId } from '@/lib/cms/blog-post-mutations';
import { invalidateCmsReadCaches } from '@/lib/cms/server-cache';

type RouteParams = { params: { id: string } };

export async function GET(_request: Request, { params }: RouteParams) {
  return withStaffGet(async () => {
    const post = await getBlogPostByLegacyId(params.id);
    if (!post) {
      const error = new Error('Blog post not found.') as Error & { status?: number };
      error.status = 404;
      throw error;
    }
    return post;
  });
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const auth = await guardEditor();
  if (isGuardFailure(auth)) return auth.response;

  try {
    const raw = await request.json();
    const parsed = blogPostPatchSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const ifMatch = request.headers.get('if-match');
    const result = await patchBlogPostByLegacyId(params.id, parsed.data, ifMatch);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    invalidateCmsReadCaches();
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
