import type { HastPluginDefinition } from 'satteri';

// Obsidian's image size syntax: ![alt|24](path) or ![alt|24x18](path).
const SIZE_SUFFIX = /^(.*?)\s*\|\s*(\d+)(?:\s*x\s*(\d+))?\s*$/;

/**
 * Lets Markdown images sit inside a line of text, for emoji and small icons.
 *
 * An image that shares its paragraph, list item, heading, or table cell with
 * text is wrapped in `span.inline-image` and is sized to the text around it. An
 * image alone in its paragraph stays a block image.
 *
 * Obsidian's size suffix is also honoured, so a size set in the editor matches
 * the published page. It becomes a CSS size rather than a resize, keeping the
 * source resolution sharp on high-density screens.
 */
export function inlineImages(): HastPluginDefinition {
  return {
    name: 'inline-images',
    element: {
      filter: ['img'],
      visit(node, ctx) {
        const alt = typeof node.properties?.alt === 'string' ? node.properties.alt : '';
        const size = SIZE_SUFFIX.exec(alt);
        if (size) {
          const [, text, width, height] = size;
          ctx.setProperty(node, 'alt', text);
          ctx.setProperty(node, 'style', height ? `width: ${width}px; height: ${height}px` : `width: ${width}px; height: auto`);
        }

        // Look past a link wrapping the image to the block that holds it.
        let container = ctx.parent(node);
        while (container?.type === 'element' && container.tagName === 'a') container = ctx.parent(container);
        if (container && ctx.textContent(container).trim()) {
          // A wrapper rather than a class on the <img>: Astro's image pipeline
          // re-emits an image's className as a literal `className` attribute.
          ctx.wrapNode(node, { type: 'element', tagName: 'span', properties: { className: ['inline-image'] }, children: [] });
        }
      },
    },
  };
}
