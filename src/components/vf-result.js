import { formatPrice } from './i18n.js';

const thumb = (src) => {
  if (!src) return null;
  const url = src.startsWith('//') ? 'https:' + src : src;
  return url.includes('cdn.shopify.com') ? url + (url.includes('?') ? '&' : '?') + 'width=160' : url;
};

const flag = (cc) => (cc && /^[A-Z]{2}$/.test(cc) ? String.fromCodePoint(...[...cc].map((c) => 0x1f1a5 + c.charCodeAt(0))) : '');

/** One record offered by one shop. Data in, semantic markup out. */
export class VfResult extends HTMLElement {
  set record(r) {
    this.replaceChildren();
    const a = Object.assign(document.createElement('a'), { href: r.url, target: '_blank', rel: 'noopener nofollow' });
    const src = thumb(r.image);
    if (src) a.append(Object.assign(document.createElement('img'), { src, alt: '', loading: 'lazy', decoding: 'async', width: 80, height: 80 }));
    a.append(Object.assign(document.createElement('strong'), { textContent: r.title }));
    const price = document.createElement('vf-price');
    price.textContent = formatPrice(r.price, r.currency);
    const shop = document.createElement('vf-shop');
    shop.setAttribute('country', r.shop.country || '');
    shop.textContent = `${flag(r.shop.country)} ${r.shop.name}`.trim();
    this.append(a, price, shop);
  }
}
customElements.define('vf-result', VfResult);
