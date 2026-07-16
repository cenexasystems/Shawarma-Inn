const fs = require('fs');
const path = require('path');

const DOMAIN = 'https://shawarmainn.in';
const DESTINATION = path.join(__dirname, '../public/sitemap.xml');

const routes = [
  { path: '/', priority: 1.0, changefreq: 'weekly' },
  { path: '/menu', priority: 0.9, changefreq: 'daily' },
  { path: '/branches', priority: 0.8, changefreq: 'monthly' },
  { path: '/offers', priority: 0.8, changefreq: 'weekly' },
  { path: '/contact', priority: 0.7, changefreq: 'monthly' },
];

function generateSitemap() {
  const urls = routes.map(route => {
    return `
  <url>
    <loc>${DOMAIN}${route.path}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`;
  }).join('');

  const sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

  fs.writeFileSync(DESTINATION, sitemapContent.trim());
  console.log(`Sitemap successfully generated at ${DESTINATION}`);
}

generateSitemap();
