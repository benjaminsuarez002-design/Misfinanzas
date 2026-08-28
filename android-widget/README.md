# Mis Finanzas Widget para Android

Reconstrucción del código fuente a partir de `MisFinanzas-widget.apk`.

Conserva el comportamiento original: actividad con WebView hacia `https://misfinanzas.uk/app` y widget de accesos rápidos para ingreso, gasto, crédito y movimiento fijo. El intent extra usado por el widget es `movement_type`.

El APK original no contenía reconocimiento de voz ni envío directo al servidor de carga rápida. Esta base queda guardada para agregar la integración con Gemini sin volver a perder el proyecto.

## Compilar

Abrir esta carpeta en Android Studio y sincronizar Gradle. Requiere Android SDK 35. El proyecto usa Java y el plugin Android Gradle 8.7.3.
