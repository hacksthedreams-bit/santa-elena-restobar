# Auditoría · Santa Elena Restobar · carta digital

Fecha: 28 de octubre de 2026. Alcance: `public/`, `worker/`, `scripts/`, datos de `source-evidence/` y `menu.json`, más una revisión en navegador (390, 768, 1024 y escritorio). Se compararon también las prácticas de los otros proyectos de la agencia (Chang Sheng, La Terraza de Lupita), que ya incluyen `404.html`, etiquetas OG, JSON-LD y páginas de privacidad.

Lo que se **verificó que está bien**: sin secretos en el código; sin dependencias npm (cero superficie de cadena de suministro); escapado HTML consistente (`esc()`) en todas las plantillas; parámetros de URL validados con lista blanca; subida de fotos limitada a JPG/PNG/WebP con comprobación de firma; stock y horarios validados en el servidor; 225 productos y precios idénticos a `source-evidence/products.json`; sin IDs duplicados, sin imágenes rotas, sin referencias de opciones huérfanas; sin fallos de contraste en fondos sólidos; un solo `h1`; `lang="es-CL"`.

Escala de prioridad: **P0** hacer ya · **P1** próxima iteración · **P2** cuando haya tiempo · **P3** opcional. Esfuerzo: **S** (horas) · **M** (1–2 días) · **L** (más). 🔒 = requiere decisión, dato o acceso del restaurante/cliente.

## Seguridad

| ID | Prio | Esf. | Hallazgo y mejora |
| --- | --- | --- | --- |
| S1 | P0 | S | **Sin cabeceras HTTP de seguridad.** La CSP existe solo como `<meta>`, que no admite `frame-ancestors`; no hay `X-Frame-Options`. La carta y `/admin` pueden incrustarse en otro sitio (clickjacking sobre los botones de stock). Añadir en el Worker, a todas las respuestas: `Content-Security-Policy` (con `frame-ancestors 'none'`), `X-Frame-Options: DENY`, `Permissions-Policy` (cámara, micrófono, geolocalización, pago desactivados) y `Cross-Origin-Opener-Policy`. |
| S2 | P0 | S | **Comprobación de origen débil.** `/api/admin/*` solo valida `Origin` si el navegador lo envía; una petición sin `Origin` pasa (probado: 200). Exigir `Origin` o `Sec-Fetch-Site: same-origin`. El dominio privado está escrito en el código: moverlo a una variable `ALLOWED_ORIGINS`. |
| S3 | P0 | S | **Errores 500 por rutas anómalas.** `GET /constructor`, `/__proto__` y `/%E0%A4%A` devuelven 500 (búsqueda en `ASSETS` sin `hasOwn` y `decodeURIComponent` sin `try`). Deben ser 404/400. |
| S4 | P1 | S | **Identidad por cabecera.** `oai-authenticated-user-email` es fiable solo detrás del alojamiento original. Si se migra, cualquiera la falsifica. Añadir un interruptor explícito (`TRUST_AUTH_HEADER`) que haga fallar cerrado si no está configurado, y prueba automática. |
| S5 | P1 | S | **Servidor de desarrollo.** `npm run dev -- --host 0.0.0.0` expondría una identidad de administrador simulada a toda la red. Negarse a enlazar fuera de loopback salvo con un indicador explícito y ruidoso. |
| S6 | P1 | M | **Fotos subidas.** Solo se valida la firma; no se reprocesan ni se elimina EXIF (puede incluir GPS del local o del teléfono, publicado en `/media/location`). Recomprimir en el cliente (canvas → WebP, máx. 1600 px) antes de subir y aplicar un límite duro de tamaño en el servidor (hoy depende de `Content-Length`). |
| S7 | P1 | M | **Sin registro de auditoría.** No se guarda quién ni cuándo cambió stock, horarios o favoritos. Guardar `updatedBy`/`updatedAt` y mostrarlo en el panel. |
| S8 | P2 | S | **Terceros sin consentimiento.** El iframe de Google Maps carga al abrir la página y la CSP permite todo `https://www.google.com`. Cargar el mapa tras un clic (fachada con imagen estática) y acotar `frame-src` a `https://www.google.com/maps/`. Quitar `data:` de `img-src` si no se usa. |
| S9 | P2 | M | **Escrituras no atómicas.** `settings.json` se lee y reescribe completo: dos administradores simultáneos pueden pisar favoritos, horarios o foto. Usar escritura condicional por ETag o separar en objetos por clave. |
| S10 | P2 | S | **Datos internos públicos.** `menu.json` publica `stock` (cantidades), `priceDelivery`, `pricePickup`, `position`, `sellAlone` y `manufacturerSource`, que la interfaz no usa. Servir una versión mínima generada en el build sin tocar `source-evidence/` 🔒 (las reglas del proyecto exigen conservar los campos originales). |
| S11 | P2 | M | **Roles de administración.** Un solo secreto `ADMIN_EMAILS` da acceso total. Separar «dueño» (horarios, fotos, favoritos) de «personal» (solo stock). |
| S12 | P3 | S | **Límite de tasa y caché del endpoint público.** `/api/state` es público y sin límite. Ver F1. |
| S13 | P3 | S | Ampliar `scripts/test-server.mjs` con los casos de S1–S6 (rutas anómalas, sin `Origin`, SVG renombrado, EXIF). |

## Funciones

| ID | Prio | Esf. | Hallazgo y mejora |
| --- | --- | --- | --- |
| F1 | P0 | M | **Coste y escala del sondeo.** Cada visitante consulta `/api/state` cada 30 s; cada llamada hace dos `list` y una lectura por producto con cambio en R2. Guardar el estado en un único objeto, añadir `Cache-Control: public, max-age=15` con ETag/304 y reducir el sondeo cuando la pestaña está oculta (ya se pausa). |
| F2 | P0 | S | **Despliegue de 14 MB.** `dist/server/index.js` incrusta todas las imágenes en base64 (14 MB) y decodifica en cada petición. Cerca de los límites de Workers; mover los recursos a almacenamiento estático/R2 con caché inmutable. |
| F3 | P1 | S | **`npm test` prueba un `dist/` posiblemente obsoleto.** Añadir `pretest` que reconstruya, y usar una función en lugar de cadena en `String.replace` de `build.mjs` (hoy seguro porque `menu.json` no contiene `$`, pero frágil). |
| F4 | P1 | M | **Orden de «Favoritos de la casa».** El panel guarda la lista pero la carta la muestra en el orden del catálogo. Permitir ordenar (subir/bajar) y respetarlo. |
| F5 | P1 | M | **Búsqueda.** Coincidencia por subcadena sin ranking ni sinónimos; la corrección «Souvignon→Sauvignon» está escrita a mano. Añadir prioridad por prefijo, sinónimos (cerveza/chela, trago/cóctel), tolerancia leve a erratas, resaltado y sugerencias en el estado vacío. |
| F6 | P1 | M | **Panel con 225 filas completas.** Cada una incluye un `input file`; pesado en móviles. Paginar o virtualizar, añadir acción masiva (marcar una categoría sin stock), confirmación para «hasta reactivar» y botón de deshacer. |
| F7 | P1 | M | **Avisos temporales.** No hay cierre por evento/feriado ni mensaje destacado. Añadir «aviso de la casa» con vigencia, y excepciones de horario por fecha. 🔒 |
| F8 | P1 | M | **Sin uso sin conexión.** En una zona rural con señal irregular la carta no carga sin red. Manifiesto + service worker que cachee `menu.json` y las imágenes vistas («Añadir a pantalla de inicio»). |
| F9 | P2 | S | **Historial.** Cada categoría o subcategoría añade una entrada; «Atrás» recorre cada filtro. Usar `replaceState` para subfiltros. |
| F10 | P2 | S | **Compartir.** Botón «Compartir/Copiar enlace» en la ficha usando Web Share y el enlace `?producto=` que ya existe. |
| F11 | P2 | M | **WhatsApp genérico.** El botón no lleva el producto. Prellenar el mensaje con nombre y precio 🔒 (requiere el número real; hoy solo existe el enlace corto `wa.link`). |
| F12 | P2 | L | **Sincronización con Fúdo.** El catálogo es una captura del 27 de octubre. Script periódico que compare precios y disponibilidad y avise de diferencias, sin sobrescribir. 🔒 acceso. |
| F13 | P2 | M | **Respaldo del estado de producción.** Stock, fotos y horarios viven solo en R2 y no se exportan. Script de exportación/restauración. |
| F14 | P3 | S | Cartel/QR de mesa con enlaces profundos por categoría. |

## Interfaz y contenido

| ID | Prio | Esf. | Hallazgo y mejora |
| --- | --- | --- | --- |
| I1 | P0 | S | **Texto genérico repetido.** 150 de 225 productos (67 %) muestran frases de relleno («…, de nuestra barra. Consulta al equipo su preparación y presentación.» ×49). Ocultar la frase genérica en las tarjetas y dejarla solo en la ficha, o sustituirla por una etiqueta breve. Las descripciones reales se completan con el restaurante 🔒. |
| I2 | P1 | S | **Objetivos táctiles < 44 px:** «Conoce sus ingredientes» (32 px), enlaces del pie (28 px), «Favoritos de la casa» y «Ver selección» (39 px). Ampliar el área sin cambiar el aspecto. |
| I3 | P1 | S | **Textos menores de 12 px** aún presentes: eslogan de la cabecera (9 px), «Ver detalle» (11 px). Subir el mínimo y revisar el modo compacto. |
| I4 | P1 | M | **Imágenes compartidas entre productos distintos.** `ref-346` sirve a pisco, vodka, shot de tequila; otras 4 imágenes se repiten en 7–8 productos. Están etiquetadas como «Presentación referencial», pero parecen un error y la regla del proyecto pide una relación razonable. Reemplazar por una ilustración neutra de categoría o por fotos reales 🔒. |
| I5 | P1 | S | **Errores de la fuente en los nombres** («Souvignon», «Absout», «Clasica», «Tonica», «corto baileys», «mousse de frutilla»). Mostrar un nombre corregido con un campo `displayName`, manteniendo `name` original 🔒 confirmación del restaurante. |
| I6 | P1 | M | **Carta muy larga.** Cócteles tiene 72 productos. Índice de secciones con seguimiento al desplazarse, «Volver arriba» y secciones plegables con «Ver los 72». |
| I7 | P2 | S | **Duplicación en tablet/escritorio.** Tarjetas de categoría y barra fija muestran lo mismo. Decidir una de las dos o mostrar la barra solo al salir de pantalla las tarjetas. |
| I8 | P2 | M | **Texto ampliado.** Es un interruptor con muchos tamaños en `px`; no respeta la preferencia de tamaño del navegador. Migrar a `rem`/`clamp`. |
| I9 | P2 | S | **Jerarquía de títulos.** Los favoritos pasan de `h2` a `h4`; el diálogo apunta a `aria-labelledby="detail-name"` antes de existir. |
| I10 | P2 | S | **Contraste sobre imágenes** (etiquetas, etiqueta del hero) no se puede comprobar con herramientas automáticas: revisar a mano; ofrecer tema de alto contraste. |
| I11 | P2 | S | **Hero móvil.** La etiqueta de producto cubre parte de la Tabla; el logo original pasó de 150 a 96 px. Validar con el cliente que sigue teniendo protagonismo suficiente. 🔒 |
| I12 | P2 | S | Esqueletos de carga en lugar del texto «Estamos preparando la carta…». |
| I13 | P2 | S | **Sin `404.html` ni página de privacidad** (la versión de Pages ya incluye la primera). Los otros proyectos tienen `privacidad.html`; aquí se usa `localStorage` y Google Maps. |
| I14 | P3 | M | Etiquetas de alérgenos y filtros dietarios. 🔒 No inventar datos: depende de información del restaurante. |

## Rendimiento

| ID | Prio | Esf. | Hallazgo y mejora |
| --- | --- | --- | --- |
| R1 | P1 | S | **Imagen del hero se pide dos veces.** El HTML trae `472.webp` y `app.js` la cambia por `ambient-food-472.webp` tras cargar `menu.json` (doble descarga y salto visual en el LCP). Fijar la correcta en el HTML con `fetchpriority` o precargarla. |
| R2 | P1 | M | **Miniaturas.** 200 imágenes WebP (9,4 MB) declaradas como 800×1000 aunque se muestran a 170–245 px. Generar variantes 320/640 con `srcset`/`sizes` (ahorro estimado ≈ 70 %) y `width/height` reales. |
| R3 | P1 | S | **Fuentes.** `barlow.woff2` (85 KB) se declara con `format('truetype')`; Outfit se carga como TTF aunque existe un `outfit.woff2` sin usar. Corregir formatos, reducir a subconjunto latino y precargar la del título. |
| R4 | P2 | S | **`menu.json` sin comprimir en el Worker** (147 KB; 14 KB con gzip). Confirmar compresión en el borde o servir una versión mínima (ver S10). |
| R5 | P2 | M | **Render completo** de 225 tarjetas (≈3 400 nodos) en cada filtro. Usar `content-visibility: auto` o render incremental por sección. |
| R6 | P2 | S | **Activos huérfanos** (≈ 260 KB): `ref-201.webp`, `ambiente.webp`, `outfit.woff2`, `wine-*.webp`, `brand-*.webp` (los de marca solo figuran en `generated-assets.json`). |
| R7 | P2 | M | **CSS con capas superpuestas.** `upgrade.css` pisa a `style.css` (p. ej. las categorías móviles se ocultaban y reaparecían). Consolidar y eliminar reglas muertas (`.photo-caption`, `.category-select`). |
| R8 | P3 | S | Pausar la cinta y la flotación del hero fuera de pantalla. |

## Operación y calidad

| ID | Prio | Esf. | Hallazgo y mejora |
| --- | --- | --- | --- |
| O1 | P1 | M | **Sin pruebas de interfaz.** Solo hay pruebas de API. Añadir Playwright para filtro, ficha, favoritos, stock y responsive. |
| O2 | P1 | S | **Integración continua.** Un workflow de GitHub Actions con build, validación y pruebas. Requiere el permiso `workflow` en el token de `gh` (hoy no lo tiene). |
| O3 | P2 | S | **Formato y estilo.** Incluir configuración de Prettier y `npm run format`; los scripts siguen minificados. |
| O4 | P2 | S | **`SHA256SUMS.txt`** debe regenerarse con cada entrega. |
| O5 | P2 | S | **Monitoreo.** Sin registro de errores ni comprobación de salud. |
| O6 | P3 | M | Migración a un solo origen de verdad: generar `menu.json` desde `products.json` con reglas versionadas (hoy `enrich.mjs` puede sobrescribirlo). |

## SEO y marca (solo cuando el cliente autorice indexar)

| ID | Prio | Esf. | Hallazgo y mejora |
| --- | --- | --- | --- |
| M1 | P2 | M | Faltan Open Graph/Twitter, `canonical`, JSON-LD (`Restaurant` + `Menu`), manifiesto y favicons en varios tamaños. Hoy la carta es `noindex` a propósito. 🔒 |
| M2 | P2 | S | `robots.txt` con `Disallow: /` y `noindex` no son una barrera de acceso: en GitHub Pages cualquiera con el enlace ve la demo. |
| M3 | P2 | S | Los horarios reales siguen pendientes y bloquean `openingHours` en el JSON-LD. 🔒 |

## Orden recomendado

1. **Seguridad inmediata (medio día):** S1, S2, S3 y F3.
2. **Costo y estabilidad (1–2 días):** F1, F2, R1.
3. **Lo que más se nota:** I1, I2, I3, R2, R3.
4. **Con el restaurante:** I4, I5, I11, F7, F11, horarios y foto real (M3).
5. **Calidad sostenida:** O1, O2, S13.

## Sobre la publicación en GitHub Pages

GitHub Pages sirve archivos estáticos: la versión publicada es una **demostración de la interfaz**. No ejecuta el Worker, así que no hay `/admin`, ni stock en vivo, ni horarios ni fotos cargadas. Se genera con `npm run build:pages` en `pages-dist/` y se publica en la rama `gh-pages`. La demo privada existente no cambia.
