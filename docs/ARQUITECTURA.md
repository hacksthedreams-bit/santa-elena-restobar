# Arquitectura y datos

## Frontend

public/index.html carga style.css, upgrade.css y app.js. La aplicación consulta /menu.json, /api/state y /api/session. El catálogo se presenta en grupos visuales, con búsqueda normalizada y filtros. Favoritos personales y preferencias de lectura se guardan en localStorage. Los favoritos de la casa, stock, horarios y fotos son compartidos mediante servidor.

public/admin.html carga admin.js y usa las API protegidas. Ningún precio ni ingrediente se edita desde el panel.

La plantilla tiene políticas CSP; si añades un servicio externo, revisa su necesidad y la CSP correspondiente. Fuentes locales con licencias OFL incluidas en source-evidence/. Los recursos finales están en public/assets/; todas las rutas del catálogo se resuelven localmente.

## API

| Ruta | Comportamiento |
| --- | --- |
| GET /api/session | Indica si la identidad actual puede administrar |
| GET /api/state | Ajustes, favoritos de la casa, stock vigente, fotos y storageReady |
| POST /api/admin/stock | id, state: source/available/unavailable, duration: today/permanent |
| POST /api/admin/settings | featured: lista de IDs (máx. 16), hours: null o siete días |
| POST /api/admin/photo | multipart: file (JPG/PNG/WebP <=4 MB) y target (ID o location) |
| GET /media/product-ID | Foto persistida de un producto |
| GET /media/location | Foto persistida del local |

Para hours el orden es domingo a sábado, coherente con Date.getDay y la representación del frontend. Un día cerrado es {"closed":true}; abierto: {"closed":false,"open":"18:00","close":"02:00"}. Esto es solo un ejemplo técnico: no representa horarios reales. Un cierre menor a apertura pertenece al día siguiente. El stock diario vence a medianoche de America/Santiago; los registros vencidos se ignoran en lectura.

Almacenamiento: settings.json, stock/ID.json y photos/product-ID o photos/location. No usar el bucket para secretos. La carta refresca cada 30 segundos y al recuperar visibilidad.

## Construcción

scripts/build.mjs lee public/, incorpora sus bytes en base64 y el catálogo en worker/index.js, sustituyendo __SITE_ASSETS__ y __SITE_MENU__. Genera dist/server/index.js y copia la configuración del alojamiento. Versiona referencias CSS/JS en HTML. scripts/validate-artifact.mjs comprueba el contrato ESM. scripts/test-server.mjs prueba permisos, origen, validación y persistencia mediante un adaptador local temporal.

scripts/dev.mjs sirve public/ directamente y usa scripts/local-bucket.mjs para simular R2 en disco. No necesita dist/. La identidad simulada se inyecta solamente en desarrollo y el host por defecto de esta entrega es 127.0.0.1. No desplegar este servidor como aplicación pública.

## Catálogo y fotografías

source-evidence/products.json es la evidencia original. public/menu.json contiene los campos originales y añade image/imageKind/imageSource, displayDescription y referencias de fabricante cuando corresponden.

scripts/enrich.mjs reconstruye las asociaciones desde el origen y los archivos existentes. Tiene reglas explícitas para imágenes de cada producto, ambientaciones y variantes. Ejecutarlo puede sobrescribir cambios manuales en menu.json: revisa el diff antes de aceptar su salida.

Proveniencia actual: 79 imágenes publicadas, 25 ambientaciones, 60 ilustrativas, 55 referencias de familia y 6 imágenes de marca (conteo por producto, no de archivos únicos). Las imágenes generadas no confirman ingredientes ni porciones. Los textos faltantes se limitan al nombre/servicio y solicitan confirmación. La captura del catálogo no está sincronizada con el sistema del restaurante.
