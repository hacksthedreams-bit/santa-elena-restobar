# Santa Elena Restobar · Entrega para Claude Code

Proyecto completo de la demo privada, exportado el 28 de octubre de 2026 por Bombvstic. Base desplegada: commit 6cfe5f6201f6c65a0e1a8662034ed1dcc671a6fa. Se incluyen código editable, los 200 recursos usados por el sitio (fotografías WebP, logo y fuentes), catálogo, evidencias originales, imágenes de marca, prompts, servidor y pruebas. No se incluyen credenciales ni la carpeta Git.

## Empezar en tu PC

Requisito: Node.js 20 o superior, con npm. No hay dependencias externas que instalar.

1. Descomprime el ZIP en una carpeta.
2. Abre **santa-elena-restobar** en VS Code / Claude Code.
3. Desde esa carpeta, ejecuta:

```sh
npm run dev
```

4. Abre http://127.0.0.1:4173/ para la carta.
5. Abre http://127.0.0.1:4173/admin para la administración local.

Para detenerlo: Ctrl+C. Los cambios de HTML/CSS/JS se ven recargando. Si cambias worker/index.js o menu.json, reinicia el servidor. Mantén el servidor local en 127.0.0.1; el modo de desarrollo simula una identidad de administrador y no debe exponerse a Internet ni a una red pública.

## Primer mensaje sugerido para Claude Code

> Lee CLAUDE.md, LEEME_PRIMERO.md, README.md, docs/ARQUITECTURA.md y docs/DESPLIEGUE_Y_PRIVACIDAD.md. Ejecuta la carta localmente y revisa su estado antes de proponer cambios. Conserva productos, precios, ingredientes y opciones de origen; identifica las imágenes ilustrativas. Mantén negro/grafito, burdeos, dorado y blanco. Trabaja localmente: no publiques ni cambies accesos sin mi autorización. Primero dime qué entendiste y después realiza los cambios concretos que te solicite.

## Comprobar el proyecto

```sh
npm run build
npm run validate
npm test
```

La construcción crea dist/server/index.js y dist/.openai/hosting.json. No uses un servidor estático como única forma de ejecutar el panel: necesita las API del servidor. No abras index.html con doble clic; usa npm run dev.

## Qué archivo cambiar

| Necesidad | Archivo |
| --- | --- |
| Secciones, hero, navegación y textos institucionales | public/index.html |
| Diseño base y ajustes de la nueva versión | public/style.css y public/upgrade.css |
| Búsqueda, tarjetas, favoritos, fichas y reloj | public/app.js |
| Catálogo servido y fotos asociadas | public/menu.json |
| Panel de gestión | public/admin.html, admin.js y admin.css |
| Stock, permisos, horarios y fotos guardadas | worker/index.js |
| Recursos del sitio | public/assets/ |
| Catálogo y configuración originales | source-evidence/ |
| Regeneración de campos de presentación | scripts/enrich.mjs |

Lee docs/ARQUITECTURA.md antes de modificar el enriquecedor: puede sobrescribir public/menu.json.

## Qué está incluido y qué queda pendiente

Se preservan los 225 productos y precios de la captura consultada el 27 de octubre de 2026. Esta captura no se sincroniza automáticamente con Fúdo. Las imágenes optimizadas necesarias para ejecutar y editar la web están incluidas; no se incluyen los PNG de trabajo de las generaciones (las versiones finales WebP sí están completas). Los prompts y las imágenes originales de marcas también están incluidos.

Los horarios reales y una foto verificada del acceso/local siguen pendientes. El panel permite cargarlos. No interpretar la configuración técnica de pedidos 00:00–23:59 del origen como horario real del restaurante.

El estado guardado en producción (stock manual, fotos cargadas, horarios) reside fuera del repositorio. No se exporta en este paquete. La última comprobación al desplegar mostró cero cambios manuales de stock y horarios sin confirmar. El modo local comienza independiente y guarda sus datos en .local-state/.

Demo actual: https://santa-elena-carta-digital.bombvstic.chatgpt.site/ (requiere la cuenta autorizada). Este ZIP no otorga acceso al alojamiento ni modifica esa demo.
