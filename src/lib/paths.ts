/** Prefixes a root-relative path (`/blog/`) with the site's base path. Other URLs pass through. */
export function withBase(path: string): string;
export function withBase(path: string | undefined): string | undefined;
export function withBase(path: string | undefined): string | undefined {
  if (!path || !path.startsWith('/') || path.startsWith('//')) return path;
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  return path.startsWith(base + '/') ? path : base + path;
}
