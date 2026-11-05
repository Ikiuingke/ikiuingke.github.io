import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import config from './data/config.json' with { type: 'json' };
import { catalog } from './src/lib/catalog.js';

const locales = Object.fromEntries(config.languages.map((l) => [l, l]));
// shop pages without records are noindex, keep them out of the sitemap too
const noindex = new Set(catalog().visible.filter((s) => !s.records).map((s) => `/shop/${s.id}/`));

export default defineConfig({
  site: config.baseUrl,
  trailingSlash: 'always',
  i18n: {
    defaultLocale: config.defaultLanguage,
    locales: config.languages,
    routing: { prefixDefaultLocale: false },
  },
  integrations: [
    sitemap({
      i18n: { defaultLocale: config.defaultLanguage, locales },
      filter: (page) => !/\/(status|404)\/?$/.test(page) && !noindex.has(new URL(page).pathname),
    }),
  ],
});
