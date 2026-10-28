# Instrucciones del proyecto para Claude Code

## Objetivo y restricciones

Carta digital de Santa Elena Restobar (Batuco/Lampa), agencia Bombvstic. Idioma es-CL, moneda CLP, zona America/Santiago. Experiencia digital independiente de la carta física.

- Trabaja localmente por defecto. No publiques, envíes invitaciones, cambies audiencia ni amplíes permisos sin autorización expresa del usuario.
- No inventes productos, precios, ingredientes, porciones, disponibilidad, horarios, reseñas o fotografías reales del local.
- Conserva IDs y campos originales de source-evidence/products.json. public/menu.json añade presentación, procedencia y descripciones limitadas; cualquier cambio comercial requiere fuente vigente o confirmación del usuario.
- No interpretes un precio cero como gratis. Pastel De Jaiba (475) muestra precio por confirmar.
- Originalmente no disponibles: productos 464 y 187, salvo cambio manual autorizado.
- Las imágenes generadas, ambientadas o reutilizadas tienen identificación. No retires esas etiquetas ni las presentes como fotografías reales exactas. Mantén relación razonable entre imagen y producto. Ver generated-assets.json y README.md.
- Negro/grafito, vino/burdeos, dorado y blanco. Conservar protagonismo de Tabla La Segunda (472), logo original, comida primero, Platos y Postres separados y Cervezas/Vinos separados.
- Accesibilidad: controles táctiles claros, contraste, foco visible, navegación con teclado, búsqueda sin tildes, tamaño de texto, reduced-motion y fichas legibles en móvil.
- No incluir secretos en código, commits, prompts ni archivos entregables. .openai/hosting.json solo identifica el proyecto: no contiene una credencial.

## Tecnología

HTML/CSS/JS nativo sin framework ni dependencias npm. Servidor de producción Worker ESM, almacenamiento tipo R2 en env.BUCKET. Autorización de producción basada en cabecera de identidad confiable del alojamiento y secreto ADMIN_EMAILS. El servidor de desarrollo simula administrador SOLO en localhost: no es autenticación utilizable en producción.

## Comandos

```sh
npm run dev
npm run build
npm run validate
npm test
```

Dev http://127.0.0.1:4173/ y /admin. Para un puerto diferente: npm run dev -- --port 4174. Reiniciar dev tras cambios del Worker/catálogo. API dev guarda .local-state/, excluido de Git/entrega. Public assets se sirven sin caché en dev.

## Flujo de cambios

1. Lee LEEME_PRIMERO.md, README.md y docs/ARQUITECTURA.md.
2. Cambia fuentes de public/, worker/ o scripts/; no edites dist/ como fuente.
3. Si tocas datos, compara los campos originales con source-evidence/products.json. No ejecutar enrich.mjs sin revisar sus reglas y cambios de salida.
4. Para cambios del servidor, construye y ejecuta pruebas. Revisa en navegador navegación, búsqueda, fichas, favoritos, stock y responsive según el cambio.
5. Comprueba tamaños 360/390/430, 768, 1024 y escritorio, texto ampliado y reduced-motion. No confundir pruebas de layout con pruebas en dispositivos reales.
6. Entrega cambios y límites concretos. El despliegue privado existente no cambia automáticamente desde esta copia.

## Pendientes conocidos

Horarios confirmados y foto real del acceso. Descripciones completas faltantes deben confirmarse con restaurante. Algunas variantes usan la imagen de referencia de su familia. Acceso administrativo del cliente aún no otorgado. Catálogo no sincronizado automáticamente con Fúdo. Mejoras de formato del código son posibles, sin alterar comportamiento accidentalmente.
