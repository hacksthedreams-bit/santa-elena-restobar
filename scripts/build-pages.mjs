// Construye la versión estática para GitHub Pages en pages-dist/.
// GitHub Pages no ejecuta el Worker: no hay stock en vivo, horarios, fotos del panel ni /admin.
// Uso: node scripts/build-pages.mjs [--base nombre-del-repo] [--domain dominio.cl]
// Con --domain se escribe el archivo CNAME y la base queda en la raíz del dominio, y se agregan
// canonical, Open Graph y datos estructurados (JSON-LD) con la URL absoluta.
// Con --public (requiere --domain) además se abre el sitio a buscadores: se quita noindex, robots.txt
// permite rastrear, se crea sitemap.xml y el pie deja de decir "demostración".
// NO usar --public sin el visto bueno del restaurante.
import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';

const OUT = 'pages-dist';
const baseArg = process.argv.indexOf('--base');
// Se indica solo el nombre del repo (sin barras) para evitar que Git Bash lo convierta en una ruta de Windows.
const repoName = baseArg > 0 ? process.argv[baseArg + 1].replace(/^\/+|\/+$/g, '') : '';
const BASE = repoName ? `/${repoName}/` : '/';
const domainArg = process.argv.indexOf('--domain');
const domain = domainArg > 0 ? process.argv[domainArg + 1].trim().toLowerCase() : '';
if (domain && !/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/.test(domain)) {
  throw new Error('Dominio no válido: ' + domain);
}
const isPublic = process.argv.includes('--public');
if (isPublic && !domain) throw new Error('--public requiere --domain');
const ADMIN_FILES = new Set(['admin.html', 'admin.js', 'admin.css']);

await fs.rm(OUT, { recursive: true, force: true });
await fs.cp('public', OUT, { recursive: true, filter: (src) => !ADMIN_FILES.has(path.basename(src)) });

let html = await fs.readFile(path.join(OUT, 'index.html'), 'utf8');
const replaceOnce = (from, to) => {
  if (!html.includes(from)) throw new Error('No se encontró en index.html: ' + from.slice(0, 60));
  html = html.replace(from, to);
};

// Versiona CSS/JS para invalidar la caché, igual que scripts/build.mjs.
for (const name of ['style.css', 'upgrade.css', 'polish.css', 'cart.css', 'app.js']) {
  const hash = createHash('sha256')
    .update(await fs.readFile(path.join(OUT, name)))
    .digest('hex')
    .slice(0, 12);
  html = html.replaceAll(`"${name}"`, `"${name}?v=${hash}"`);
}

// Modo estático: app.js no consulta /api y no sondea el servidor.
replaceOnce('<meta name="robots"', '<meta name="se-static" content="1"><meta name="robots"');
replaceOnce('<a id="admin-link" href="/admin" hidden>Administrar carta ↗</a>', '');
replaceOnce(
  'Vista privada de revisión',
  'Demostración estática · el stock, los horarios y las fotos del panel no están activos',
);
if (domain) {
  const site = `https://${domain}/`;
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'Restaurant',
    name: 'Santa Elena Restobar',
    url: site,
    image: site + 'assets/og-image.jpg',
    hasMenu: site + '#carta',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Fundo Santa Elena Lote 21',
      addressLocality: 'Batuco, Lampa',
      addressRegion: 'Región Metropolitana',
      addressCountry: 'CL',
    },
    geo: { '@type': 'GeoCoordinates', latitude: -33.2325396, longitude: -70.7709506 },
    sameAs: ['https://www.instagram.com/santaelena_restobar/'],
  };
  const tags =
    `<meta name="twitter:card" content="summary_large_image"><link rel="canonical" href="${site}">` +
    `<meta property="og:url" content="${site}"><meta property="og:image" content="${site}assets/og-image.jpg">` +
    `<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">` +
    `<meta property="og:image:alt" content="Logo de Santa Elena Restobar y Tabla La Segunda">` +
    `<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script>`;
  // Se usa una función para que "$" en el texto no se interprete como patrón de reemplazo.
  html = html.replace('<meta name="twitter:card" content="summary_large_image">', () => tags);
}
if (isPublic) {
  replaceOnce('<meta name="robots" content="noindex,nofollow,noarchive">', '<meta name="robots" content="index,follow">');
  replaceOnce('Demostración estática · el stock, los horarios y las fotos del panel no están activos', 'Consulta disponibilidad con el equipo');
}
await fs.writeFile(path.join(OUT, 'index.html'), html);

const notFound = `<!doctype html>
<html lang="es-CL"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Página no encontrada · Santa Elena Restobar</title><link rel="stylesheet" href="${BASE}style.css"></head>
<body><main class="shell"><div class="empty"><h3>PÁGINA NO ENCONTRADA</h3><p>El enlace no existe o cambió. Vuelve a la carta digital de Santa Elena Restobar.</p><a class="button primary" href="${BASE}">Ir a la carta</a></div></main></body></html>
`;
await fs.writeFile(path.join(OUT, '404.html'), notFound);
await fs.writeFile(path.join(OUT, '.nojekyll'), '');
if (domain) await fs.writeFile(path.join(OUT, 'CNAME'), domain + '\n');
if (isPublic) {
  await fs.writeFile(path.join(OUT, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: https://${domain}/sitemap.xml\n`);
  await fs.writeFile(
    path.join(OUT, 'sitemap.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://${domain}/</loc><lastmod>${new Date().toISOString().slice(0, 10)}</lastmod></url></urlset>\n`,
  );
}

const files = (await fs.readdir(OUT, { recursive: true })).length;
console.log(`Versión estática creada en ${OUT}/ (${files} entradas), base ${BASE}`);
