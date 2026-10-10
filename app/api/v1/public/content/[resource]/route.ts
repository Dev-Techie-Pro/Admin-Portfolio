type RouteCtx = { params: { resource?: string } };

export async function OPTIONS(request: Request): Promise<Response> {
  const mod = await import('../../../public/content/[resource]/route');
  return mod.OPTIONS(request);
}

export async function GET(request: Request, ctx: RouteCtx): Promise<Response> {
  const mod = await import('../../../public/content/[resource]/route');
  return mod.GET(request, ctx);
}
