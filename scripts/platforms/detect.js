/** Guess the shop software from homepage HTML and headers. */
const MARKERS = [
  ['shopify', /cdn\.shopify\.com|Shopify\.theme|myshopify\.com/i],
  ['woocommerce', /woocommerce|wc-block|\/wp-json\/wc\//i],
  ['bigcartel', /bigcartel/i],
  ['bandcamp', /bandcamp\.com|bcbits\.com/i],
  ['squarespace', /squarespace/i],
  ['wix', /wix\.com|wixstatic|_wixCIDX/i],
  ['square', /square\.site|squareup|weebly/i],
  ['ecwid', /ecwid/i],
  ['prestashop', /prestashop/i],
  ['magento', /Magento_|\/static\/version\d+\/|mage\/cookies/],
  ['shopware', /shopware/i],
  ['bigcommerce', /bigcommerce/i],
  ['opencart', /route=product|opencart/i],
  ['wordpress', /wp-content|wp-includes/i],
];

export function detectPlatform(html = '', headers = new Headers()) {
  if (headers.get('x-shopid') || headers.get('x-shopify-stage')) return 'shopify';
  for (const [name, re] of MARKERS) if (re.test(html)) return name;
  return 'unknown';
}

export const pageTitle = (html = '') => {
  const og = html.match(/<meta[^>]+property=["']og:site_name["'][^>]+content=["']([^"']+)/i)?.[1];
  const title = html.match(/<title[^>]*>([^<]{1,200})<\/title>/i)?.[1];
  return (og || title || '').replace(/\s+/g, ' ').trim() || null;
};
