# Wallpaper Video LAN

Aplicación web local (Node.js + Express) para explorar y reproducir por streaming los videos ya existentes en:

`steamapps/workshop/content/431960/`

Pensada para abrirse desde tu teléfono dentro de la misma red Wi-Fi.

## Características

- Escaneo recursivo real de la carpeta Workshop de Wallpaper Engine.
- Indexado en memoria (sin base de datos).
- Solo detecta archivos de video soportados:
  - `.mp4` `.webm` `.mkv` `.avi` `.mov`
- Ignora wallpapers que no sean video.
- API REST mínima:
  - `GET /api/videos`
  - `GET /api/video/:id/stream`
  - `GET /api/thumbnail/:id` (si hay `ffmpeg` disponible)
- UI móvil, rápida y responsive:
  - buscador
  - grilla de tarjetas
  - filtro "solo carpetas con video"
  - reproductor HTML5 integrado
- Servidor escuchando en `0.0.0.0` para acceso LAN.
- Configuración por `.env`.

## Estructura

```text
wallpaper-video-lan/
  public/
    index.html
    styles.css
    app.js
  src/
    config.js
    utils.js
    videoIndexer.js
    thumbnailService.js
    server.js
  .env
  .env.example
  .gitignore
  package.json
  README.md
```

## Requisitos

- Windows con Node.js 18+ (probado con Node 24).
- Carpeta local de Workshop de Wallpaper Engine ya existente.
- Opcional: `ffmpeg` y `ffprobe` en PATH para miniaturas y duración más completa.
- `WallpaperVideoLAN.HostControl.exe` ahora es self-contained y no requiere `.NET Desktop Runtime` aparte.

## Configuración

1. Abre `%USERPROFILE%\WallpaperVideoLAN\.env`.
2. Verifica `WALLPAPER_ROOT`:

```env
WALLPAPER_ROOT=C:\\
HOST=0.0.0.0
PORT=3000
SCAN_INTERVAL_SECONDS=180
ENABLE_DURATION_PROBE=true
```

Por defecto ahora usa `C:\`. Si quieres limitar el escaneo (recomendado), cambia la ruta a una carpeta más específica.

## Ejecución

En PowerShell (desde la carpeta del proyecto):

```powershell
cd C:\Users\TU_USUARIO\WallpaperVideoLAN
npm.cmd install
npm.cmd run dev
```

Producción local:

```powershell
npm.cmd start
```

## Abrir desde el teléfono

1. Asegúrate de que PC y teléfono estén en la misma Wi-Fi.
2. Obtén la IP local del PC:

```powershell
ipconfig
```

3. Busca la IPv4 (ej. `192.168.1.22`).
4. En el teléfono abre:

`http://192.168.1.22:3000`

## API

### `GET /api/videos`
Devuelve videos indexados, fecha de escaneo y carpetas con video.

### `GET /api/video/:id/stream`
Streaming con soporte de `Range` para reproducción fluida y seek en navegador móvil.

### `GET /api/thumbnail/:id`
Intenta generar miniatura JPEG con `ffmpeg` y la cachea en `.cache/thumbnails`.
Si no se puede generar, responde `404` y la UI usa placeholder elegante.

### `POST /api/rescan`
Fuerza un nuevo escaneo inmediato.

## Decisiones técnicas

- **Sin base de datos**: índice en memoria para simplicidad y velocidad.
- **IDs estables**: hash SHA-1 de ruta absoluta para manejar nombres con espacios o caracteres raros.
- **Streaming robusto**: implementación manual de `Range` para compatibilidad con reproductores HTML5.
- **Miniaturas opcionales**: no bloquea funcionamiento si no hay `ffmpeg`.
- **Duración best-effort**: se intenta con `ffprobe`; si no está disponible, la UI muestra `--:--`.

## Notas

- No descarga nada de Steam.
- No usa autenticación ni Docker.
- Solo explora y reproduce archivos locales existentes.

## Instalador para otra PC (desde GitHub)

En la otra PC, descarga y ejecuta:

`installer\Instalar-Desde-GitHub.bat`

Si quieres generar un instalador `.exe` unico desde este repo:

`crear-instalador-exe.bat`

Salida esperada:

`installer\dist\WallpaperVideoLAN-Installer.exe`

Si quieres generar un autoextraible WinRAR:

`crear-instalador-winrar-sfx.bat`

Ese instalador:
- descarga el repo desde GitHub
- instala todo en `%USERPROFILE%\WallpaperVideoLAN`
- ejecuta `npm install`
- crea/actualiza `.env`
- pregunta si quieres auto inicio con Windows
- no deja `.bat` en escritorio
- crea un acceso directo en escritorio a `WallpaperVideoLAN.HostControl.exe`
- usa un `WallpaperVideoLAN.HostControl.exe` self-contained
- si eliges auto inicio, copia `AutoInicio-WallpaperVideoLAN.bat` a:
  - `%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup`

Notas:
- Si no ejecutas como administrador, el firewall puede quedar bloqueando acceso LAN.
- Si pones `C:\` como `WALLPAPER_ROOT`, escanea todo el disco y puede tardar bastante.
