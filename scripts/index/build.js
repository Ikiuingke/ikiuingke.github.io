import fs from 'node:fs';
import path from 'node:path';
import { files, GENERATED, PUBLIC } from '../lib/paths.js';
import { config } from '../lib/config.js';
import { writeJson } from '../lib/json.js';
import { loadCatalog } from './catalog.js';
import { buildSearchIndex } from './search-index.js';
import { buildSiteData } from './site-data.js';

/** Crawl output -> static search index in public/search and data for the page builder. */
const outDir = path.join(PUBLIC, 'search');
fs.rmSync(outDir, { recursive: true, force: true });
if (!fs.existsSync(files.products)) {
  console.warn('no generated/products.ndjson.gz yet: building an empty index');
  fs.mkdirSync(GENERATED, { recursive: true });
  fs.writeFileSync(files.products, (await import('node:zlib')).gzipSync(''));
}
const t0 = Date.now();
const catalog = await loadCatalog(files.products);
const meta = buildSearchIndex({ ...catalog, outDir, docsPerChunk: config.search.docsPerChunk });
const siteData = buildSiteData({ ...catalog, seo: config.seo });
writeJson(path.join(GENERATED, 'site-data.json'), siteData);
console.log('index built in', Math.round((Date.now() - t0) / 1000), 's', meta, 'artist pages:', siteData.artists.length);
