# Continuidad de alojamiento y privacidad

Esta entrega es editable e independiente. No contiene tokens de Sites, acceso a la cuenta del propietario, credenciales R2, correo secreto de administrador, sesiones, .git ni datos locales de prueba. La demo existente permanece privada y no cambia al editar esta carpeta.

## Mantener el despliegue existente

.openai/hosting.json conserva el identificador real del proyecto y binding BUCKET. Claude Code por sí solo no obtiene acceso a ese proyecto. Para actualizarlo se requiere una integración autorizada con el alojamiento y credenciales emitidas por su propietario, o devolver los cambios al flujo que administra esa demo. No guardar ni compartir tokens dentro del ZIP o del repositorio.

El build está preparado para el contrato Worker ESM del alojamiento actual. La publicación y el control privado del sitio se gestionan fuera del código. El proyecto debe seguir restringido al propietario mientras no exista autorización expresa para ampliar acceso.

## Trasladar a otro alojamiento

La interfaz puede reutilizarse, pero stock compartido y administración requieren backend. Un hosting de archivos estáticos por sí solo no ejecuta estas funciones.

Antes de un despliegue nuevo:

1. Elegir un runtime compatible con Request/Response y con la exportación default.fetch, o adaptar worker/index.js al servidor elegido.
2. Configurar almacenamiento persistente equivalente a R2 y vincularlo como env.BUCKET. Las operaciones utilizadas son get/put/delete/list; el adaptador local muestra el contrato mínimo. Usar almacenamiento nuevo o migrar los objetos de producción mediante acceso autorizado.
3. Adaptar canManage a autenticación real del proveedor. La cabecera oai-authenticated-user-email solo es confiable detrás del alojamiento original, que controla la identidad. En otro servidor no debe aceptarse una cabecera enviada libremente por el navegador. La simulación de identidad de dev no puede utilizarse como autenticación.
4. Configurar ADMIN_EMAILS como secreto del servidor, sin valores reales en Git. Revisar los orígenes permitidos en worker/index.js, que actualmente incluyen el dominio privado original. Ajustar CSP y protección de acceso a la carta y a /media/ para el entorno nuevo.
5. Verificar almacenamiento, permisos, imágenes, horario Chile, vencimiento del stock, búsqueda y responsive. Mantener acceso restringido durante la revisión y solicitar autorización antes de publicar o agregar usuarios.

Los cambios de stock/fotos/horarios realizados por el panel se guardan en el bucket, no en los archivos del proyecto. Su exportación requiere acceso aparte; no suponer que están dentro de este ZIP. No sobrescribirlos al migrar.
