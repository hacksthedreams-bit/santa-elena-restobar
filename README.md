# Santa Elena Restobar · Carta digital privada

Experiencia móvil independiente de la carta física, con 225 productos. Hero animado con Tabla La Segunda y logo original; tipografías locales Outfit y Barlow Condensed; navegación, categorías visuales, fichas, búsqueda sin tildes, favoritos de la casa y favoritos personales, lectura ampliada y vista compacta.

## Datos y fuentes

Captura de la carta enlazada oficialmente, consultada el 27 de octubre de 2026: https://menu.fu.do/boragourmet/qr-menu. Respuestas originales conservadas en source-evidence. Marca y canales: https://linktr.ee/santaelenarestobar y https://www.instagram.com/santaelena_restobar/.

Los 225 IDs, nombres, precios, descripciones originales, opciones y estados de origen permanecen intactos. No hay sincronización automática con Fúdo. El producto 475 tiene precio de origen cero y se muestra “Precio por confirmar”. Los productos 464 y 187 conservan su indisponibilidad salvo cambio manual. Dos anotaciones ambiguas (149 y 290) se conservan en datos pero no se presentan como descripción comercial.

Cada producto tiene imagen y texto de presentación. Donde no existe receta publicada, el texto se limita al nombre y solicita confirmación al equipo; no se agregan recetas supuestas. Las notas nuevas de vinos enlazan la fuente del fabricante en la ficha. Las imágenes se identifican: 79 publicadas, 25 ambientaciones, 60 ilustraciones, 55 referencias de la misma familia y 6 imágenes de marca. Las referencias compartidas no son fotos exactas de cada variedad. Prompts, procedencia y recursos de marcas están en source-evidence; los ingredientes válidos son únicamente los publicados en las descripciones del restaurante.

Ubicación publicada: Fundo Santa Elena Lote 21, Lampa; https://maps.app.goo.gl/WdcHvynQcLZh5uJS7. WhatsApp oficial: https://wa.link/7uks2v. No se enviaron mensajes ni se verificó entrega/reservas en aplicaciones externas. No se encontraron horarios oficiales confirmados ni una foto real verificable del acceso. Se muestra mapa, reloj America/Santiago y horario por confirmar; el administrador puede cargar la foto y el horario semanal.

## Administración

/admin requiere la identidad autenticada del propietario mediante la cabecera confiable del alojamiento y la variable secreta ADMIN_EMAILS. Esta versión no incorpora nuevas personas autorizadas. El cliente necesitará acceso autorizado antes de administrar por su cuenta.

Stock central persistente: “Por hoy” vence a medianoche America/Santiago; “Hasta reactivar” no vence. “Estado original” elimina la modificación. La carta consulta actualizaciones cada 30 segundos y al recuperar visibilidad. Estrellas configuran favoritos de la casa; corazones personales se guardan solamente en el dispositivo. Se pueden reemplazar imágenes por producto, subir foto real del local y confirmar horarios con cierre al día siguiente. No se editan precios ni recetas desde este panel.

## Alojamiento y privacidad

Mismo proyecto y URL privada. No se agregan visitantes, grupos ni colaboradores. La barrera de acceso real la aplica Sites; robots/noindex son complementarios. No hay analítica ni fuentes remotas. El mapa externo está limitado a Google Maps mediante CSP.

Worker ESM con almacenamiento R2 BUCKET, sin base D1. Las escrituras validan identidad, origen, IDs y contenido; las imágenes admiten JPG/PNG/WebP hasta 4 MB. public/ contiene fuentes estáticas; worker/index.js servidor; scripts/build.mjs incorpora recursos al artefacto con versiones de CSS/JS para invalidar caché anterior. La identidad local de scripts/dev.mjs solo existe en preview y no se incluye en producción.

Desarrollo: npm run dev. Construcción: npm run build. Validación: npm run validate y node scripts/test-server.mjs. dist/ es salida generada, ignorada por Git.

## Nota de esta entrega portable

Consultar LEEME_PRIMERO.md y CLAUDE.md. Se ajustó únicamente esta copia de entrega para nombre de paquete, comando npm test, wrapper build.sh y host de desarrollo 127.0.0.1. No se modificó ni redesplegó el sitio privado. Los prompts conservan el nombre de archivo de generación como trazabilidad; los archivos finales utilizables son los WebP de public/assets/.

## Demostración en GitHub Pages

La rama `gh-pages` contiene una versión **estática** de la interfaz (`npm run build:pages` genera `pages-dist/`). GitHub Pages no ejecuta el Worker: no hay `/admin`, stock en vivo, horarios ni fotos cargadas desde el panel, y el pie de página lo indica. Sigue siendo `noindex`. La demo privada con servidor no cambia.

**Dominio propio (`santaelenarestobar.cl`):** `npm run build:pages:dominio` genera `pages-dist/` con la base en la raíz y un archivo `CNAME`; su contenido se publica en la rama `gh-pages`. DNS: registros A de `@` hacia `185.199.108.153`, `185.199.109.153`, `185.199.110.153` y `185.199.111.153`, y CNAME de `www` hacia `hacksthedreams-bit.github.io`. Para abrirla al público falta quitar `noindex` (meta en `public/index.html` y `public/robots.txt`) y el texto de demostración, con el visto bueno del restaurante. Auditoría y mejoras pendientes: [AUDITORIA.md](AUDITORIA.md).

## Retoque visual (10 de noviembre de 2026)

- **Logo:** se usa el logo original en formato rectangular (`assets/logo-wide.webp`, derivado de `ambiente.webp`), sin recorte circular.
- **Hero:** `public/polish.css` (se carga después de `upgrade.css`) define el nuevo hero con tres tarjetas (Tabla La Segunda, Laguna Azul y Tabla Las Alitas Club), sello giratorio y datos rápidos. Las tarjetas abren la ficha del producto.
- **Reloj:** esfera analógica en SVG (marcas y manecillas se dibujan en `app.js`) más hora digital con segundos, fecha y estado de apertura, todo en zona America/Santiago.
- **Redes y enlaces:** se eliminó el enlace a Linktree (mostraba publicidad ajena) y los atajos `wa.link` y `maps.app.goo.gl` (redirigían). Ahora WhatsApp es `wa.me/56967119121` con un mensaje de cliente (en las fichas incluye el nombre del producto), Google Maps usa coordenadas y hay una sección “Estamos a un clic”. El número es el que resolvía el enlace oficial `wa.link/7uks2v`; si cambia, se edita en `public/index.html` y en `WA_NUMBER` de `app.js`.
- **Descripciones:** `npm run polish:menu` (`scripts/copy.mjs`) reescribe solo las 150 descripciones que la carta no trae (`descriptionKind: "name"`). Usa únicamente datos del nombre del producto (sabor, marca, formato) y no inventa recetas ni ingredientes. Es idempotente y debe ejecutarse después de `scripts/enrich.mjs` si alguna vez se vuelve a correr. No modifica ids, nombres, precios ni descripciones originales.
- **Botellas de marca:** `python scripts/stage-bottles.py` (Pillow + numpy) compone las botellas recortadas sobre un escenario de barra y genera `assets/stage-*.webp`. Siguen identificadas como “Imagen de marca”; el producto 290 conserva su imagen publicada con el fondo reemplazado.

## Segunda tanda de mejoras (10 de noviembre de 2026)

- **Pedido por WhatsApp:** cada ficha tiene “+ Agregar” (con selector de cantidad), hay una barra flotante “Ver mi pedido” y una hoja con la lista, comentarios y total referencial (`cart.css` y la sección “Pedido por WhatsApp” de `app.js`). No cobra ni confirma nada: arma el mensaje y abre `wa.me`. El pedido se guarda solo en el dispositivo (`localStorage`). No se pueden agregar productos sin stock ni con precio por confirmar.
- **Secciones nuevas:** “Arma tu selección” (tres pasos) y “Un vistazo a la carta” (galería con productos que tienen imagen publicada por el restaurante; los ids están en `GALLERY_IDS`).
- **Velocidad:** `python scripts/make-thumbs.py` (`npm run thumbs`) crea `assets/sm/` con copias de 560 px que usan las listas de la versión estática. El Worker privado no las incluye (`build.mjs` omite `sm/`) y sigue con las imágenes completas. Las secciones bajo el pliegue usan `content-visibility`.
- **SEO y redes:** `build-pages.mjs --domain` agrega canonical, Open Graph, imagen para compartir (`assets/og-image.jpg`) y datos estructurados de restaurante (solo nombre, dirección, coordenadas, menú e Instagram; sin horarios ni teléfono porque no están confirmados).
- **Apertura a buscadores (pendiente de aprobación):** `npm run build:pages:publico` genera la versión sin `noindex`, con `robots.txt` abierto, `sitemap.xml` y el pie sin la palabra “demostración”. No usarlo hasta que el restaurante lo apruebe y confirme los horarios.

