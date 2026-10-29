# Android v11: notificaciones

## Actualización v13: descarga del APK

El botón Android llama al gestor de descargas nativo, previa confirmación de la descarga. Android 6–9 solicita WRITE_EXTERNAL_STORAGE solo al aceptar la descarga; rechazarlo cancela esa descarga. Android 10+ guarda en Descargas mediante DownloadManager sin permiso general de almacenamiento. No se solicita almacenamiento al abrir ni al iniciar sesión.

El archivo se guarda con sufijo de fecha para evitar conflictos con descargas anteriores. Al terminar, abrirlo desde Descargas. Android controla la autorización para instalar APK externos; esta versión no instala automáticamente.

Los APK v11/v12 usan el navegador externo al tocar el botón actualizado de la web para poder obtener la v13. Se conserva la misma firma de v11/v12: instalar como actualización, sin desinstalar.

## Actualización v12

Después de iniciar sesión, ofrece activar notificaciones la primera vez. Al aceptar pide el permiso de Android y registra el teléfono automáticamente cuando se concede. **Ahora no** evita volver a mostrar la pregunta; se puede activar luego desde la campanita. La v12 usa la misma firma que la v11 y se instala como actualización.

## Implementación activa

- Interfaz y controles en `app.html`. El APK sigue cargando la web de `https://misfinanzas.uk/app`.
- Android registrado en Firebase como `1:933125362701:android:11ec37cc38a90fec3ef144`.
- Firebase Cloud Messaging recibe los mensajes en el teléfono; Cloudflare envía los mensajes. No requiere desplegar Cloud Functions ni activar Blaze.
- El Worker existente `misfinanzas-carga-rapida` añade `POST /voz/android-push/device`. Valida la sesión Firebase antes de registrar, desactivar o probar un teléfono. La prueba tiene un límite de una por minuto por token.
- D1 guarda dispositivos y recibos en las tablas nuevas `android_push_devices` y `android_push_receipts`.
- El cron horario busca movimientos con recordatorio activado, no confirmados, que vencen hoy o dentro de tres días según Buenos Aires. No repite la misma combinación de movimiento/fecha/anticipo/teléfono.
- Al tocar una notificación se abre la campanita. Se desvincula el dispositivo al cerrar sesión.
- El correo y su servicio externo no se modifican. Los gastos compartidos no tienen aún disparador push.
- Se retiró la implementación preliminar de Cloud Functions que exigía Blaze; no se desplegaron esas funciones.

## Servicio y credenciales

El secreto `GOOGLE_PUSH_SERVICE_ACCOUNT` de Cloudflare contiene la identidad `misfinanzas-push@finanzas-51439.iam.gserviceaccount.com`. Solo tiene los roles `roles/datastore.viewer` y `roles/firebasecloudmessaging.admin`. La clave privada no está en el repositorio ni el APK.

## Compilar

La firma y sus credenciales están fuera del repositorio, en `%USERPROFILE%\.misfinanzas-signing`. El script `build-release.ps1` las carga para la compilación. Requiere Java 17, Gradle 8.9 y SDK Android 35; se descargaron a `%LOCALAPPDATA%\MisFinanzasBuild`.

El APK anterior tiene otra firma: la primera instalación de v11 exige desinstalarlo. Comprobar antes que los datos estén sincronizados. No desinstalar futuras versiones firmadas con esta misma clave.

## Activar en el teléfono

Instalar `MisFinanzas-notificaciones-v11.apk`, iniciar sesión, abrir la campanita y tocar **Activar y probar avisos en este teléfono**. Aceptar el permiso de Android; si se solicita, volver a tocar el botón para enviar la prueba. Se necesita conexión y servicios de Google Play.

La recepción real debe probarse en el dispositivo: primer aviso, segundo plano, apertura de la campanita y cierre de sesión. Android y la conectividad pueden retrasar la entrega. No hay garantía de hora exacta ni de recepción tras forzar la detención de la app.
