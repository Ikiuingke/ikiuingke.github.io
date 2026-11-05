import { getJson } from '../lib/http.js';
import { sleep } from '../lib/pool.js';
import { decodeEntities } from '../lib/text.js';
import { keepProduct, musicRatio } from './filter.js';

const PAGE_SIZE = 250;
const text = (p) => [p.title, p.product_type, p.vendor, ...(Array.isArray(p.tags) ? p.tags : [p.tags])].join(' ');

/** Shop metadata and a catalog sample. */
export async function probe(origin) {
  const meta = await getJson(`${origin}/meta.json`);
  const sample = await getJson(`${origin}/products.json?limit=100`);
  if (!sample.ok) return { ok: false, reason: `products_json_${sample.status || sample.error}` };
  const products = sample.data.products || [];
  return {
    ok: true,
    name: meta.data?.name || null,
    city: meta.data?.city || null,
    country: meta.data?.country || null,
    currency: meta.data?.currency || null,
    musicRatio: musicRatio(products.map((p) => [p.title, text(p)])),
    sampleSize: products.length,
  };
}

/** Yield normalised in-stock music products, page by page. */
export async function* crawl(shop, { maxPages, delayMs, inStockOnly, deadline, strict }) {
  for (let page = 1; page <= maxPages && Date.now() < deadline; page++) {
    const res = await getJson(`${shop.url}/products.json?limit=${PAGE_SIZE}&page=${page}`, { retries: 4 });
    if (!res.ok) {
      if (page === 1) throw new Error(`products_json_${res.status || res.error}`);
      return; // Shopify stops paging at 25k products with a 400
    }
    const products = res.data.products || [];
    for (const p of products) {
      const available = p.variants?.some((v) => v.available);
      if (inStockOnly && !available) continue;
      if (!keepProduct(p.title, text(p), strict)) continue;
      const prices = (p.variants || []).filter((v) => v.available || !inStockOnly).map((v) => parseFloat(v.price)).filter((n) => n > 0);
      yield {
        title: decodeEntities(p.title).trim(),
        vendor: p.vendor || null,
        type: p.product_type || null,
        price: prices.length ? Math.round(Math.min(...prices) * 100) : null,
        path: `/products/${p.handle}`,
        image: p.images?.[0]?.src?.replace(/^https?:/, '') || null,
        updated: p.updated_at || p.published_at || null,
      };
    }
    if (products.length < PAGE_SIZE) return;
    await sleep(delayMs);
  }
}
