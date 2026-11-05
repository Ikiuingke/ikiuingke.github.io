import { SearchClient } from '../lib/search/client.js';
import { t, formatNumber } from './i18n.js';
import './vf-result.js';

/**
 * <vf-search> enhances a server-rendered GET form (works without JS as a link target).
 * Attributes reflect state for CSS: status="idle|loading|done|empty".
 */
export class VfSearch extends HTMLElement {
  connectedCallback() {
    this.client = new SearchClient(this.getAttribute('index') || '/search/');
    this.form = this.querySelector('form');
    this.input = this.querySelector('input[name="q"]');
    this.output = this.querySelector('output') || this.appendChild(document.createElement('output'));
    this.per = Number(this.getAttribute('per-page')) || 30;
    this.form.addEventListener('submit', (e) => { e.preventDefault(); this.run(this.input.value, true); });
    window.addEventListener('popstate', () => this.fromUrl());
    this.fromUrl();
  }

  fromUrl() {
    const q = new URLSearchParams(location.search).get('q') || '';
    this.input.value = q;
    if (q) this.run(q, false); else this.setAttribute('status', 'idle');
  }

  async run(query, push) {
    const q = query.trim();
    if (push) {
      const url = new URL(location.href);
      q ? url.searchParams.set('q', q) : url.searchParams.delete('q');
      history.pushState(null, '', url);
    }
    if (!q) { this.output.replaceChildren(); this.setAttribute('status', 'idle'); return; }
    document.title = `${q} · ${t('siteName')}`;
    this.setAttribute('status', 'loading');
    this.ids = await this.client.match(q);
    this.shown = 0;
    this.output.replaceChildren();
    const summary = document.createElement('p');
    summary.textContent = this.ids.length ? t('resultsCount', { count: formatNumber(this.ids.length), query: q }) : t('noResults', { query: q });
    this.list = document.createElement('ol');
    this.output.append(summary, this.list);
    this.setAttribute('status', this.ids.length ? 'done' : 'empty');
    await this.more();
    window.umami?.track?.('search', { q, results: this.ids.length });
  }

  async more() {
    const slice = this.ids.slice(this.shown, this.shown + this.per);
    this.shown += slice.length;
    const records = await this.client.records(slice);
    for (const r of records) {
      const li = document.createElement('li');
      const el = document.createElement('vf-result');
      el.record = r;
      li.append(el);
      this.list.append(li);
    }
    this.button?.remove();
    if (this.shown < this.ids.length) {
      this.button = Object.assign(document.createElement('button'), { type: 'button', textContent: t('loadMore') });
      this.button.addEventListener('click', () => this.more());
      this.output.append(this.button);
    }
  }
}
customElements.define('vf-search', VfSearch);
