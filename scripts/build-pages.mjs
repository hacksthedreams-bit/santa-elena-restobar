// Construye la versión estática para GitHub Pages en pages-dist/.
// GitHub Pages no ejecuta el Worker: no hay stock en vivo, horarios, fotos del panel ni /admin.
// Uso: node scripts/build-pages.mjs [--base nombre-del-repo]
import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';

const OUT = 'pages-dist';
const baseArg = process.argv.indexOf('--base');
// Se indica solo el nombre del repo (sin barras) para evitar que Git Bash lo convierta en una ruta de Windows.
const repoName = baseArg > 0 ? process.argv[baseArg + 1].replace(/^\/+|\/+$/g, '') : '';
const BASE = repoName ? `/${repoName}/` : '/';
const ADMIN_FILES = new Set(['admin.html', 'admin.js', 'admin.css']);

await fs.rm(OUT, { recursive: true, force: true });
await fs.cp('public', OUT, { recursive: true, filter: (src) => !ADMIN_FILES.has(path.basename(src)) });

let html = await fs.readFile(path.join(OUT, 'index.html'), 'utf8');
const replaceOnce = (from, to) => {
  if (!html.includes(from)) throw new Error('No se encontró en index.html: ' + from.slice(0, 60));
  html = html.replace(from, to);
};

// Versiona CSS/JS para invalidar la caché, igual que scripts/build.mjs.
for (const name of ['style.css', 'upgrade.css', 'app.js']) {
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
await fs.writeFile(path.join(OUT, 'index.html'), html);

const notFound = `<!doctype html>
<html lang="es-CL"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Página no encontrada · Santa Elena Restobar</title><link rel="stylesheet" href="${BASE}style.css"></head>
<body><main class="shell"><div class="empty"><h3>PÁGINA NO ENCONTRADA</h3><p>El enlace no existe o cambió. Vuelve a la carta digital de Santa Elena Restobar.</p><a class="button primary" href="${BASE}">Ir a la carta</a></div></main></body></html>
`;
await fs.writeFile(path.join(OUT, '404.html'), notFound);
await fs.writeFile(path.join(OUT, '.nojekyll'), '');

const files = (await fs.readdir(OUT, { recursive: true })).length;
console.log(`Versión estática creada en ${OUT}/ (${files} entradas), base ${BASE}`);
