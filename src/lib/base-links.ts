import type { HastPluginDefinition } from 'satteri';

/**
 * Prefixes root-relative links and images in Markdown (`/uploads/cat.png`,
 * `/about/`) with the site's base path, so content written for the site root
 * keeps working while the site is served from a sub-path.
 */
export function baseLinks(base: string): HastPluginDefinition {
  const prefix = base.replace(/\/$/, '');
  const rewrite = (value: unknown) =>
    typeof value === 'string' && prefix && value.startsWith('/') && !value.startsWith('//') && !value.startsWith(prefix + '/')
      ? prefix + value
      : undefined;
  return {
    name: 'base-links',
    element: {
      filter: ['a', 'img'],
      visit(node, ctx) {
        const key = node.tagName === 'a' ? 'href' : 'src';
        const next = rewrite(node.properties?.[key]);
        if (next) ctx.setProperty(node, key, next);
      },
    },
  };
}
