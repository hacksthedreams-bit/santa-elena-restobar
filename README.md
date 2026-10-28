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

La rama `gh-pages` contiene una versión **estática** de la interfaz (`npm run build:pages` genera `pages-dist/`). GitHub Pages no ejecuta el Worker: no hay `/admin`, stock en vivo, horarios ni fotos cargadas desde el panel, y el pie de página lo indica. Sigue siendo `noindex`. La demo privada con servidor no cambia. Auditoría y mejoras pendientes: [AUDITORIA.md](AUDITORIA.md).
