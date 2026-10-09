function sanitizeRedirectPath(raw, fallback = "/") {
  if (raw == null || raw === "") return fallback;
  const path = String(raw).trim();
  if (!path.startsWith("/") || path.startsWith("//")) return fallback;
  if (/^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(path)) return fallback;
  if (path.includes("\\")) return fallback;
  if (path.includes("\0")) return fallback;
  return path;
}
export {
  sanitizeRedirectPath
};
//# sourceMappingURL=safeRedirectPath.js.map
