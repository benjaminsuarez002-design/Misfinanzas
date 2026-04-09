using System.Diagnostics;
using System.IO.Compression;
using System.Net.Http;
using System.Runtime.InteropServices;
using System.Security.Cryptography;
using System.Security.Principal;
using System.Text;

namespace WallpaperVideoLAN.Installer;

internal static class Program
{
    private const string RepoZipUrl = "https://codeload.github.com/benjaminsuarez002-design/Misfinanzas/zip/refs/heads/main";
    private const string SubdirInRepo = @"pajereadas\wallpaper-video-lan";
    private const string DefaultRoot = @"C:\";
    private const string FirewallRule = "WallpaperVideoLAN-3000";
    private const int TotalSteps = 9;
    private const int BarWidth = 28;

    private static readonly string UserProfile = Environment.GetFolderPath(Environment.SpecialFolder.UserProfile);
    private static readonly string WorkDir = Path.Combine(UserProfile, "WallpaperVideoLAN");
    private static readonly string TempDir = Path.Combine(Path.GetTempPath(), "wvlan-bootstrap");
    private static readonly string ZipPath = Path.Combine(TempDir, "misfinanzas-main.zip");
    private static readonly string ExtractDir = Path.Combine(TempDir, "extract");
    private static readonly string RepoRootInZip = Path.Combine(ExtractDir, "Misfinanzas-main");
    private static readonly string SourceDir = Path.Combine(RepoRootInZip, SubdirInRepo);
    private static readonly string LaunchersDir = Path.Combine(WorkDir, "installer", "launchers");
    private static readonly string ToolsDir = Path.Combine(WorkDir, "installer", "tools");

    private static string? _appExeDest;
    private static string? _appIconDest;
    private static string? _desktopShortcut;
    private static string? _autoTemplate;

    [STAThread]
    private static async Task<int> Main()
    {
        Console.OutputEncoding = Encoding.UTF8;

        var installOk = false;

        try
        {
            Console.WriteLine();
            Console.WriteLine("=== Instalador WallpaperVideoLAN desde GitHub (.exe) ===");
            Console.WriteLine();

            Progress(1, "Preparando carpetas");
            PrepareDirectories();

            Progress(2, "Descargando repo desde GitHub");
            await DownloadRepoAsync();

            Progress(3, "Extrayendo ZIP");
            ExtractZip();

            if (!File.Exists(Path.Combine(SourceDir, "package.json")))
            {
                Fail($"[ERROR] No se encontro la app en: {SourceDir}");
            }

            Progress(4, $"Copiando app a {WorkDir}");
            StopRunningInstalledHostControls();
            CopyAppFiles();

            Progress(5, "Verificando Node.js");
            EnsureNode();

            Progress(6, "Verificando/instalando dependencias");
            InstallDependencies();

            Progress(7, "Configurando .env");
            ConfigureEnv();

            Progress(8, "Configurando firewall y acceso directo");
            ConfigureFirewall();
            CreateShortcut();
            ConfigureAutostart();

            Progress(9, "Finalizando instalacion");

            Console.WriteLine();
            Console.WriteLine("Instalacion completada.");
            Console.WriteLine($"App: {WorkDir}");
            Console.WriteLine($"Ejecutable: {_appExeDest}");
            Console.WriteLine($"Icono: {_appIconDest}");
            Console.WriteLine("Acceso directo en escritorio:");
            Console.WriteLine($"- {_desktopShortcut}");
            Console.WriteLine();

            installOk = true;
        }
        catch (Exception ex)
        {
            Console.WriteLine();
            Console.WriteLine(ex.Message);
            Console.WriteLine();
            Console.WriteLine("Instalacion cancelada por error.");
            Console.WriteLine();
        }

        Console.WriteLine();

        if (installOk && AskYesNo("Abrir Host Control ahora? [S/N]: "))
        {
            LaunchHostControl();
        }

        Console.WriteLine();
        Console.Write("Presiona una tecla para cerrar este instalador...");
        Console.ReadKey(true);
        Console.WriteLine();

        return installOk ? 0 : 1;
    }

    private static void PrepareDirectories()
    {
        if (Directory.Exists(TempDir))
        {
            Directory.Delete(TempDir, recursive: true);
        }

        Directory.CreateDirectory(TempDir);
        Directory.CreateDirectory(ExtractDir);
        Directory.CreateDirectory(WorkDir);
    }

    private static async Task DownloadRepoAsync()
    {
        using var httpClient = new HttpClient
        {
            Timeout = TimeSpan.FromMinutes(10)
        };
        httpClient.DefaultRequestHeaders.UserAgent.ParseAdd("WallpaperVideoLAN-Installer/1.0");

        using var response = await httpClient.GetAsync(RepoZipUrl, HttpCompletionOption.ResponseHeadersRead);
        response.EnsureSuccessStatusCode();

        await using var source = await response.Content.ReadAsStreamAsync();
        await using var destination = File.Create(ZipPath);
        await source.CopyToAsync(destination);
    }

    private static void ExtractZip()
    {
        if (Directory.Exists(ExtractDir))
        {
            Directory.Delete(ExtractDir, recursive: true);
            Directory.CreateDirectory(ExtractDir);
        }

        ZipFile.ExtractToDirectory(ZipPath, ExtractDir, overwriteFiles: true);
    }

    private static void CopyAppFiles()
    {
        var excludedDirectories = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            "node_modules",
            ".git",
            ".cache",
            "dist"
        };

        var excludedFiles = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            ".env",
            "server.log"
        };

        CopyDirectoryRecursive(SourceDir, WorkDir, excludedDirectories, excludedFiles);
    }

    private static void StopRunningInstalledHostControls()
    {
        var stoppedCount = 0;

        foreach (var process in Process.GetProcessesByName("WallpaperVideoLAN.HostControl"))
        {
            try
            {
                var processPath = process.MainModule?.FileName;
                if (string.IsNullOrWhiteSpace(processPath))
                {
                    continue;
                }

                if (!processPath.StartsWith(WorkDir, StringComparison.OrdinalIgnoreCase))
                {
                    continue;
                }

                Console.WriteLine($"[INFO] Cerrando proceso en uso: {processPath}");
                process.Kill(entireProcessTree: true);
                process.WaitForExit(5000);
                stoppedCount++;
            }
            catch
            {
                // Si no se puede inspeccionar o cerrar un proceso, seguimos y dejamos que la copia lo maneje.
            }
            finally
            {
                process.Dispose();
            }
        }

        if (stoppedCount > 0)
        {
            Thread.Sleep(1000);
            Console.WriteLine($"[INFO] Se cerraron {stoppedCount} instancia(s) previas de Host Control.");
        }
    }

    private static void EnsureNode()
    {
        RefreshNodePathHints();

        if (HasCommand("node") && HasCommand("npm.cmd"))
        {
            return;
        }

        Console.WriteLine("[INFO] Node.js no encontrado. Intentando instalar automaticamente...");

        if (!HasCommand("winget"))
        {
            Fail("[ERROR] No se encontro winget. Instala Node.js LTS manualmente.");
        }

        var exitCode = RunStreamingProcess(
            "winget",
            [
                "install",
                "OpenJS.NodeJS.LTS",
                "-e",
                "--accept-package-agreements",
                "--accept-source-agreements",
                "--disable-interactivity"
            ]);

        if (exitCode != 0)
        {
            Fail("[ERROR] Fallo la instalacion automatica de Node.js.");
        }

        RefreshNodePathHints();

        if (!HasCommand("node") || !HasCommand("npm.cmd"))
        {
            Fail("[ERROR] Node.js o npm no quedaron disponibles aun. Reabre la sesion y ejecuta de nuevo.");
        }
    }

    private static void InstallDependencies()
    {
        var stampFile = Path.Combine(WorkDir, ".deps-lock.sha256");
        var lockFile = Path.Combine(WorkDir, "package-lock.json");
        var nodeModulesDir = Path.Combine(WorkDir, "node_modules");
        var lockHash = File.Exists(lockFile) ? ComputeSha256(lockFile) : string.Empty;
        var previousHash = File.Exists(stampFile) ? File.ReadAllText(stampFile).Trim() : string.Empty;

        if (Directory.Exists(nodeModulesDir) && !string.IsNullOrWhiteSpace(lockHash) &&
            string.Equals(lockHash, previousHash, StringComparison.OrdinalIgnoreCase))
        {
            Console.WriteLine("[INFO] Dependencias ya estan instaladas. Saltando npm install.");
            return;
        }

        Console.WriteLine("[INFO] Ejecutando npm install...");
        var exitCode = RunStreamingProcess("npm.cmd", ["install"], WorkDir);
        if (exitCode != 0)
        {
            Fail("[ERROR] Fallo npm install.");
        }

        if (!string.IsNullOrWhiteSpace(lockHash))
        {
            File.WriteAllText(stampFile, lockHash + Environment.NewLine);
        }
    }

    private static void ConfigureEnv()
    {
        Console.WriteLine();
        Console.WriteLine("Ruta de videos:");
        Console.WriteLine("- Presiona ENTER para usar la ruta por defecto.");
        Console.WriteLine("- O escribe una ruta personalizada (ej: C:\\).");
        Console.WriteLine();

        string selectedRoot;
        do
        {
            Console.Write($"Ruta de videos [ENTER={DefaultRoot}]: ");
            selectedRoot = Console.ReadLine()?.Trim() ?? string.Empty;
            if (string.IsNullOrEmpty(selectedRoot))
            {
                selectedRoot = DefaultRoot;
            }

            Console.WriteLine($"Ruta elegida: \"{selectedRoot}\"");
        }
        while (!AskYesNo("Confirmar ruta? [S/N]: "));

        File.WriteAllLines(
            Path.Combine(WorkDir, ".env"),
            [
                $"WALLPAPER_ROOT={selectedRoot}",
                "HOST=0.0.0.0",
                "PORT=3000",
                "SCAN_INTERVAL_SECONDS=180",
                "ENABLE_DURATION_PROBE=true"
            ]);
    }

    private static void ConfigureFirewall()
    {
        Console.WriteLine("[INFO] Configurando firewall (si hay permisos admin)...");
        if (!IsAdministrator())
        {
            Console.WriteLine("[AVISO] Sin permisos de administrador. Saltando firewall.");
            return;
        }

        var command =
            $"if (-not (Get-NetFirewallRule -DisplayName '{FirewallRule}' -ErrorAction SilentlyContinue)) {{ " +
            $"New-NetFirewallRule -DisplayName '{FirewallRule}' -Direction Inbound -Action Allow -Protocol TCP -LocalPort 3000 -Profile Private | Out-Null }}";

        var exitCode = RunStreamingProcess("powershell", ["-NoProfile", "-Command", command]);
        if (exitCode != 0)
        {
            Fail("[ERROR] No se pudo configurar la regla de firewall.");
        }
    }

    private static void CreateShortcut()
    {
        var desktopDir = Environment.GetFolderPath(Environment.SpecialFolder.DesktopDirectory);
        if (string.IsNullOrWhiteSpace(desktopDir))
        {
            desktopDir = Path.Combine(UserProfile, "Desktop");
        }

        if (!Directory.Exists(desktopDir))
        {
            var alternateDesktop = Path.Combine(UserProfile, "Escritorio");
            desktopDir = Directory.Exists(alternateDesktop) ? alternateDesktop : desktopDir;
        }

        Directory.CreateDirectory(desktopDir);

        _appExeDest = Path.Combine(WorkDir, "WallpaperVideoLAN.HostControl.exe");
        _appIconDest = Path.Combine(WorkDir, "WallpaperVideoLAN.HostControl.ico");
        _desktopShortcut = Path.Combine(desktopDir, "WallpaperVideoLAN Host Control.lnk");
        _autoTemplate = Path.Combine(LaunchersDir, "AutoInicio-WallpaperVideoLAN.bat");

        var appExeSrc = Path.Combine(ToolsDir, "WallpaperVideoLAN.HostControl.exe");
        var appIconSrc = Path.Combine(ToolsDir, "WallpaperVideoLAN.HostControl.ico");

        DeleteIfExists(Path.Combine(desktopDir, "Levantar-Host-WallpaperVideoLAN.bat"));
        DeleteIfExists(Path.Combine(desktopDir, "Levantar-Host-WallpaperVideoLAN-Visible.bat"));
        DeleteIfExists(Path.Combine(desktopDir, "Cerrar-Host-WallpaperVideoLAN.bat"));

        if (!File.Exists(appExeSrc))
        {
            Fail($"[ERROR] No se encontro el ejecutable en: {appExeSrc}");
        }

        if (!File.Exists(_autoTemplate))
        {
            Fail($"[ERROR] No se encontro el auto inicio base en: {_autoTemplate}");
        }

        CopyFileWithRetry(appExeSrc, _appExeDest, allowSkipLockedExistingFile: true);

        if (File.Exists(appIconSrc))
        {
            CopyFileWithRetry(appIconSrc, _appIconDest, allowSkipLockedExistingFile: true);
        }

        var iconForShortcut = File.Exists(_appIconDest) ? _appIconDest : _appExeDest;
        CreateShellShortcut(_desktopShortcut, _appExeDest, WorkDir, iconForShortcut);

        Console.WriteLine("[OK] Acceso directo creado en escritorio:");
        Console.WriteLine($"- {_desktopShortcut}");
    }

    private static void ConfigureAutostart()
    {
        var startupDir = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData),
            "Microsoft",
            "Windows",
            "Start Menu",
            "Programs",
            "Startup");

        Directory.CreateDirectory(startupDir);

        var autoBat = Path.Combine(startupDir, "AutoInicio-WallpaperVideoLAN.bat");
        if (!AskYesNo("Quieres iniciar WallpaperVideoLAN con Windows? [S/N]: "))
        {
            DeleteIfExists(autoBat);
            Console.WriteLine("[OK] Auto inicio desactivado.");
            return;
        }

        File.Copy(_autoTemplate!, autoBat, overwrite: true);
        Console.WriteLine($"[OK] Auto inicio activado: {autoBat}");
    }

    private static void LaunchHostControl()
    {
        if (string.IsNullOrWhiteSpace(_appExeDest) || !File.Exists(_appExeDest))
        {
            Console.WriteLine("[ERROR] No se encontro el Host Control para abrir.");
            return;
        }

        var startInfo = new ProcessStartInfo
        {
            FileName = _appExeDest,
            WorkingDirectory = WorkDir,
            UseShellExecute = true
        };

        Process.Start(startInfo);
    }

    private static void CopyDirectoryRecursive(
        string sourceDir,
        string destinationDir,
        HashSet<string> excludedDirectories,
        HashSet<string> excludedFiles)
    {
        Directory.CreateDirectory(destinationDir);

        foreach (var directory in Directory.GetDirectories(sourceDir))
        {
            var name = Path.GetFileName(directory);
            if (excludedDirectories.Contains(name))
            {
                continue;
            }

            CopyDirectoryRecursive(
                directory,
                Path.Combine(destinationDir, name),
                excludedDirectories,
                excludedFiles);
        }

        foreach (var file in Directory.GetFiles(sourceDir))
        {
            var name = Path.GetFileName(file);
            if (excludedFiles.Contains(name))
            {
                continue;
            }

            var destinationFile = Path.Combine(destinationDir, name);
            CopyFileWithRetry(file, destinationFile, allowSkipLockedExistingFile: true);
        }
    }

    private static void CopyFileWithRetry(string sourceFile, string destinationFile, bool allowSkipLockedExistingFile)
    {
        const int maxAttempts = 3;

        for (var attempt = 1; attempt <= maxAttempts; attempt++)
        {
            try
            {
                Directory.CreateDirectory(Path.GetDirectoryName(destinationFile)!);
                File.Copy(sourceFile, destinationFile, overwrite: true);
                return;
            }
            catch (IOException ex) when (IsSharingViolation(ex))
            {
                if (attempt < maxAttempts)
                {
                    Thread.Sleep(700);
                    continue;
                }

                if (allowSkipLockedExistingFile && File.Exists(destinationFile))
                {
                    Console.WriteLine($"[AVISO] Archivo en uso, se conserva la version existente: {destinationFile}");
                    return;
                }

                throw;
            }
        }
    }

    private static bool IsSharingViolation(IOException exception)
    {
        var errorCode = exception.HResult & 0xFFFF;
        return errorCode is 32 or 33;
    }

    private static bool HasCommand(string command)
    {
        var result = RunCapturedProcess("where", [command]);
        return result.ExitCode == 0 && !string.IsNullOrWhiteSpace(result.StdOut);
    }

    private static void RefreshNodePathHints()
    {
        var currentPath = Environment.GetEnvironmentVariable("PATH") ?? string.Empty;
        var candidates = new[]
        {
            Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles), "nodejs"),
            Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86), "nodejs"),
            Path.Combine(UserProfile, "AppData", "Local", "Programs", "nodejs")
        };

        foreach (var candidate in candidates)
        {
            if (!Directory.Exists(candidate) || currentPath.Contains(candidate, StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            currentPath = string.IsNullOrEmpty(currentPath) ? candidate : $"{currentPath};{candidate}";
        }

        Environment.SetEnvironmentVariable("PATH", currentPath);
    }

    private static string ComputeSha256(string filePath)
    {
        using var stream = File.OpenRead(filePath);
        using var sha256 = SHA256.Create();
        var hash = sha256.ComputeHash(stream);
        return Convert.ToHexString(hash);
    }

    private static bool AskYesNo(string prompt)
    {
        while (true)
        {
            Console.Write(prompt);
            var key = Console.ReadKey(intercept: true);
            Console.WriteLine(key.KeyChar);

            var value = char.ToUpperInvariant(key.KeyChar);
            if (value == 'S' || value == 'Y')
            {
                return true;
            }

            if (value == 'N')
            {
                return false;
            }
        }
    }

    private static bool IsAdministrator()
    {
        using var identity = WindowsIdentity.GetCurrent();
        var principal = new WindowsPrincipal(identity);
        return principal.IsInRole(WindowsBuiltInRole.Administrator);
    }

    private static void DeleteIfExists(string filePath)
    {
        if (File.Exists(filePath))
        {
            File.Delete(filePath);
        }
    }

    private static void CreateShellShortcut(string shortcutPath, string targetPath, string workingDirectory, string iconLocation)
    {
        var shellType = Type.GetTypeFromProgID("WScript.Shell")
                       ?? throw new InvalidOperationException("[ERROR] No se pudo acceder a WScript.Shell.");

        object? shell = null;
        object? shortcut = null;

        try
        {
            shell = Activator.CreateInstance(shellType);
            shortcut = shellType.InvokeMember("CreateShortcut", System.Reflection.BindingFlags.InvokeMethod, null, shell, [shortcutPath]);
            var shortcutType = shortcut!.GetType();

            shortcutType.InvokeMember("TargetPath", System.Reflection.BindingFlags.SetProperty, null, shortcut, [targetPath]);
            shortcutType.InvokeMember("WorkingDirectory", System.Reflection.BindingFlags.SetProperty, null, shortcut, [workingDirectory]);
            shortcutType.InvokeMember("IconLocation", System.Reflection.BindingFlags.SetProperty, null, shortcut, [$"{iconLocation},0"]);
            shortcutType.InvokeMember("Save", System.Reflection.BindingFlags.InvokeMethod, null, shortcut, null);
        }
        catch (Exception ex)
        {
            throw new InvalidOperationException("[ERROR] No se pudo crear el acceso directo en escritorio.", ex);
        }
        finally
        {
            if (shortcut is not null && Marshal.IsComObject(shortcut))
            {
                Marshal.FinalReleaseComObject(shortcut);
            }

            if (shell is not null && Marshal.IsComObject(shell))
            {
                Marshal.FinalReleaseComObject(shell);
            }
        }
    }

    private static void Progress(int step, string label)
    {
        var pct = step * 100 / TotalSteps;
        var filled = step * BarWidth / TotalSteps;
        var bar = new string('#', filled) + new string('-', BarWidth - filled);
        Console.WriteLine($"[{bar}] {pct}% - {label}");
    }

    private static (int ExitCode, string StdOut, string StdErr) RunCapturedProcess(
        string fileName,
        IReadOnlyList<string> arguments,
        string? workingDirectory = null)
    {
        var startInfo = new ProcessStartInfo
        {
            FileName = fileName,
            WorkingDirectory = workingDirectory ?? Environment.CurrentDirectory,
            UseShellExecute = false,
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            CreateNoWindow = true
        };

        foreach (var argument in arguments)
        {
            startInfo.ArgumentList.Add(argument);
        }

        using var process = Process.Start(startInfo)
                            ?? throw new InvalidOperationException($"[ERROR] No se pudo ejecutar {fileName}.");

        var stdOut = process.StandardOutput.ReadToEnd();
        var stdErr = process.StandardError.ReadToEnd();
        process.WaitForExit();

        return (process.ExitCode, stdOut, stdErr);
    }

    private static int RunStreamingProcess(
        string fileName,
        IReadOnlyList<string> arguments,
        string? workingDirectory = null)
    {
        var startInfo = new ProcessStartInfo
        {
            FileName = fileName,
            WorkingDirectory = workingDirectory ?? Environment.CurrentDirectory,
            UseShellExecute = false
        };

        foreach (var argument in arguments)
        {
            startInfo.ArgumentList.Add(argument);
        }

        using var process = Process.Start(startInfo)
                            ?? throw new InvalidOperationException($"[ERROR] No se pudo ejecutar {fileName}.");
        process.WaitForExit();
        return process.ExitCode;
    }

    private static void Fail(string message)
    {
        throw new InvalidOperationException(message);
    }
}
