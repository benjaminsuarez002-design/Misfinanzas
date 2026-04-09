# HANDOFF WallpaperVideoLAN

## Repo
- GitHub: https://github.com/benjaminsuarez002-design/Misfinanzas
- Carpeta del proyecto: `pajereadas/wallpaper-video-lan`

## Instalador (link directo)
- https://raw.githubusercontent.com/benjaminsuarez002-design/Misfinanzas/main/pajereadas/wallpaper-video-lan/installer/Instalar-Desde-GitHub.bat

## Instalador EXE local
- Proyecto: `installer/exe-installer/WallpaperVideoLAN.Installer.csproj`
- Build: `crear-instalador-exe.bat`
- Salida: `installer/dist/WallpaperVideoLAN-Installer.exe`

## Estado actual importante
- El instalador:
  - Descarga el repo desde GitHub
  - Instala app en `%USERPROFILE%\WallpaperVideoLAN`
  - Ejecuta `npm install`
  - Configura `.env` (root por defecto `C:\`)
  - Pregunta auto inicio con Windows
  - **NO deja `.bat` en escritorio**
  - Crea acceso directo en escritorio al `WallpaperVideoLAN.HostControl.exe`
  - Copia icono al programa y lo usa en el acceso directo
- Auto inicio usa:
  - `%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\AutoInicio-WallpaperVideoLAN.bat`

## Archivos clave del instalador
- `installer/Instalar-Desde-GitHub.bat`
- `installer/tools/WallpaperVideoLAN.HostControl.exe`
- `installer/tools/WallpaperVideoLAN.HostControl.ico`
- `installer/launchers/AutoInicio-WallpaperVideoLAN.bat`

## Host Control (Windows)
- EXE: `WallpaperVideoLAN.HostControl.exe`
- Proyecto fuente: `installer/hostcontrol`
- Función: iniciar/detener servidor Node en segundo plano y mostrar URL local/teléfono.
- Estado actual:
  - self-contained
  - no requiere `.NET Desktop Runtime` instalado en la PC destino

## API / App Web (Node + Express)
- `GET /api/videos`
- `GET /api/video/:id/stream`
- `GET /api/thumbnail/:id`
- `POST /api/rescan`
- Servidor en `0.0.0.0:3000`

## Android host APK
- Proyecto: `android-host-apk`
- APK debug salida:
  - `android-host-apk/app/build/outputs/apk/debug/app-debug.apk`
- Icono del APK configurado con `@mipmap/ic_launcher` y `@mipmap/ic_launcher_round`

## Comandos útiles
### App web
```powershell
cd %USERPROFILE%\WallpaperVideoLAN
npm install
npm run dev
npm start
```

### Android APK (si hace falta recompilar)
```powershell
cd C:\ruta\wallpaper-video-lan\android-host-apk
set JAVA_HOME=C:\Program Files\ojdkbuild\java-17-openjdk-17.0.3.0.6-1
.\gradlew.bat assembleDebug
```

## Últimos commits relevantes
- `423b6f8` Installer: acceso directo con icono y sin .bat en escritorio
- `110ad68` Add updated host control exe for installer

## Nota de continuidad
Si seguís en otra PC, primero corré el instalador directo de arriba y validá:
1. acceso directo en escritorio
2. host inicia y muestra IPv4 + puerto 3000
3. teléfono abre `http://IP_LOCAL:3000`
