import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current file directory with ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const domain = 'http://localhost:3000';
const outputPath = path.join(path.resolve(__dirname, '..'), 'public', 'sitemap.xml');
const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

// Define your site's routes
const routes = [
  {
    url: '/',
    lastmod: today,
    changefreq: 'weekly',
    priority: 1.0,
  },
  // Add more routes as your application grows
];

// Generate sitemap XML
function generateSitemap() {
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes
  .map(
    (route) => `  <url>
    <loc>${domain}${route.url}</loc>
    <lastmod>${route.lastmod}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>`;

  // Ensure directory exists
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Write sitemap to file
  fs.writeFileSync(outputPath, sitemap);
  console.log(`Sitemap generated at ${outputPath}`);
}

// Run the generator
generateSitemap();