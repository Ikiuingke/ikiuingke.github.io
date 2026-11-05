/**
 * Minimal robots.txt parser: rules for our bot name or "*".
 * Returns { allowed(path), crawlDelay, sitemaps }.
 */
export function parseRobots(text = '', botName = 'vinylfinderbot') {
  const groups = [];
  let current = null;
  const sitemaps = [];
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.replace(/#.*/, '').trim();
    const m = line.match(/^([a-z-]+)\s*:\s*(.*)$/i);
    if (!m) continue;
    const key = m[1].toLowerCase();
    const value = m[2].trim();
    if (key === 'sitemap') { sitemaps.push(value); continue; }
    if (key === 'user-agent') {
      if (!current || current.rules.length || current.delay != null) groups.push((current = { agents: [], rules: [], delay: null }));
      current.agents.push(value.toLowerCase());
    } else if (current && (key === 'allow' || key === 'disallow')) {
      current.rules.push({ allow: key === 'allow', path: value });
    } else if (current && key === 'crawl-delay') {
      current.delay = Number(value) || null;
    }
  }
  const mine = groups.filter((g) => g.agents.some((a) => a !== '*' && botName.includes(a)));
  const group = mine[0] || groups.find((g) => g.agents.includes('*')) || { rules: [], delay: null };
  const toRegex = (p) => new RegExp('^' + p.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\\\$$/, '$'));
  const rules = group.rules.filter((r) => r.path).map((r) => ({ ...r, re: toRegex(r.path), len: r.path.length }));
  return {
    crawlDelay: group.delay,
    sitemaps,
    allowed(pathname) {
      let best = null;
      for (const r of rules) if (r.re.test(pathname) && (!best || r.len > best.len || (r.len === best.len && r.allow))) best = r;
      return !best || best.allow;
    },
  };
}
