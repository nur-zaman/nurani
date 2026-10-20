// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { satteri } from '@astrojs/markdown-satteri';
import { inlineImages } from './src/lib/inline-images.ts';
import { baseLinks } from './src/lib/base-links.ts';
import { base, site } from './deploy.config.mjs';

// https://astro.build/config
export default defineConfig({
  site,
  base,
  output: 'static',
  trailingSlash: 'always',
  integrations: [sitemap({ filter: page => !page.endsWith('/404/') && !page.includes('/admin/') })],
  markdown: {
    processor: satteri({ hastPlugins: [inlineImages(), baseLinks(base)] }),
    shikiConfig: { theme: 'github-light', wrap: false },
  },
  // The build verification fixture lives in .cache so Astro can move generated
  // assets atomically. It is never part of the live site.
  vite: { server: { watch: { ignored: ['**/.cache/**'] } } },
});
