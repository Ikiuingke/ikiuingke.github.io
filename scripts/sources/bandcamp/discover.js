import { config } from '../../lib/config.js';
import { sleep } from '../../lib/pool.js';

const API = 'https://bandcamp.com/api/discover/1/discover_web'; // allowed in bandcamp.com/robots.txt
const strip = (url) => String(url || '').split('?')[0];

/** One discover result with a physical package -> release record. */
export function toRelease(r, format) {
  const pkg = (r.package_info || []).find((p) => p.format === format);
  if (!pkg) return null;
  const bandUrl = strip(r.band_url).replace(/\/$/, '');
  return {
    id: String(r.item_id),
    title: `${r.album_artist || r.band_name} – ${r.title}`,
    artist: r.album_artist || r.band_name,
    seller: r.band_name,
    bandUrl,
    url: strip(r.item_url),
    image: r.primary_image?.image_id ? `//f4.bcbits.com/img/a${r.primary_image.image_id}_7.jpg` : null,
    price: pkg.price?.amount ?? null,
    currency: pkg.price?.currency || null,
    format: pkg.title || format,
    preorder: !!pkg.is_preorder,
    location: r.band_location || null,
    released: r.release_date?.slice(0, 10) || null,
  };
}

/**
 * Page through Bandcamp discover for one physical format, newest first.
 * Yields { releases, next } per page; `next` is null at the end. Resume with `cursor`.
 */
export async function* discover({ categoryId, format, maxPages, deadline, cursor = '*' }) {
  for (let page = 0; page < maxPages && cursor && Date.now() < deadline; page++) {
    const res = await fetch(API, {
      method: 'POST',
      headers: { 'user-agent': config.crawl.userAgent, 'content-type': 'application/json' },
      body: JSON.stringify({ category_id: categoryId, tag_norm_names: [], geoname_id: 0, slice: 'new', time_facet_id: null, cursor, size: 60, include_result_types: ['a', 's'] }),
      signal: AbortSignal.timeout(30_000),
    }).catch(() => null);
    if (!res?.ok) { await sleep(30_000); continue; }
    const data = await res.json().catch(() => ({}));
    const releases = (data.results || []).map((r) => toRelease(r, format)).filter(Boolean);
    cursor = data.results?.length ? data.cursor : null;
    yield { releases, next: cursor };
    await sleep(config.bandcamp.delayMs);
  }
}
