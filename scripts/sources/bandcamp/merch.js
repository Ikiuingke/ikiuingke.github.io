import { decodeEntities } from '../../lib/text.js';

const PHYSICAL = /vinyl|cassette|\bcd\b|record/i;
const text = (s) => decodeEntities(String(s || '').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();

/** "€6" + "EUR" -> 600 cents */
const cents = (price) => {
  const n = parseFloat(String(price || '').replace(/[^\d.,]/g, '').replace(/,(\d{2})$/, '.$1').replace(/,/g, ''));
  return Number.isFinite(n) ? Math.round(n * 100) : null;
};

/**
 * Parse a label/artist /merch page into physical items:
 * { path, title, format, price, currency, image, available }.
 */
export function parseMerch(html) {
  const items = [];
  for (const block of html.split('<li data-item-id=').slice(1)) {
    const href = block.match(/<a href="([^"]+)"/)?.[1];
    const format = text(block.match(/class="merchtype[^"]*">([^<]+)/)?.[1]);
    if (!href || !PHYSICAL.test(format)) continue;
    const [title] = text(block.match(/<p class="title">([\s\S]*?)<\/p>/)?.[1]).split(/\s+–\s+(?=[^–]*$)/);
    items.push({
      path: href.startsWith('http') ? new URL(href).pathname : href,
      title: title.replace(/\s+–$/, '').trim(),
      format,
      price: cents(block.match(/<span class="price">([^<]+)<\/span>/)?.[1]),
      currency: block.match(/<span class="currency">([A-Z]{3})<\/span>/)?.[1] || null,
      image: (block.match(/data-original="([^"]+)"/) || block.match(/<img src="(https:[^"]+)"/))?.[1]?.replace(/^https?:/, '') || null,
      available: !/class="price sold-out"/.test(block),
    });
  }
  return items;
}
