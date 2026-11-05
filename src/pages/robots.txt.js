export const GET = ({ site }) => new Response(`User-agent: *
Allow: /
Disallow: /search/

Sitemap: ${new URL('/sitemap-index.xml', site).href}
`);
