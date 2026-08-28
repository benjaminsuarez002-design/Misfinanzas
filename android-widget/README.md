# Mis Finanzas Widget para Android

Reconstrucción del código fuente a partir de `MisFinanzas-widget.apk`.

Conserva el comportamiento original: actividad con WebView hacia `https://misfinanzas.uk/app` y widget de accesos rápidos para ingreso, gasto, crédito y movimiento fijo. El intent extra usado por el widget es `movement_type`.

Además incluye `VoiceCaptureActivity`, que solicita permiso de micrófono, escucha un movimiento en español y lo envía como `{ token, text }` al mismo endpoint de carga rápida de Mis Finanzas. La clave se guarda en preferencias privadas del dispositivo y se solicita una sola vez.

La acción `com.misfinanzas.app.ANOTAR_GASTO` y el acceso directo del widget permiten que Gemini/Google Assistant abran directamente el modo de escucha. El APK instalado manualmente no puede recibir automáticamente el texto hablado por Gemini sin una integración oficial de App Actions publicada en Google Play; en ese caso la actividad escucha el movimiento al abrirse.

El APK original no contenía reconocimiento de voz ni envío directo al servidor de carga rápida. Esta base queda guardada para agregar la integración con Gemini sin volver a perder el proyecto.

## Compilar

Abrir esta carpeta en Android Studio y sincronizar Gradle. Requiere Android SDK 35. El proyecto usa Java y el plugin Android Gradle 8.7.3.
