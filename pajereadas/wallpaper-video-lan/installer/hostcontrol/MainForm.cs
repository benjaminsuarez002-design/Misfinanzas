using System.Diagnostics;
using System.Net.NetworkInformation;
using System.Net.Sockets;
using System.Text;

namespace WallpaperVideoLAN.HostControl;

internal sealed class MainForm : Form
{
    private const int Port = 3000;

    private readonly string _appDirectory;
    private readonly Label _statusValue;
    private readonly Label _localUrlValue;
    private readonly Label _phoneUrlValue;
    private readonly Label _hintLabel;
    private readonly Button _startButton;
    private readonly Button _stopButton;
    private readonly Button _openButton;
    private readonly Button _copyButton;
    private readonly System.Windows.Forms.Timer _refreshTimer;

    public MainForm()
    {
        _appDirectory = ResolveAppDirectory();

        Text = "WallpaperVideoLAN Host Control";
        StartPosition = FormStartPosition.CenterScreen;
        FormBorderStyle = FormBorderStyle.FixedDialog;
        MaximizeBox = false;
        MinimizeBox = true;
        ClientSize = new Size(560, 290);
        BackColor = Color.FromArgb(248, 250, 252);

        if (File.Exists(Path.Combine(_appDirectory, "WallpaperVideoLAN.HostControl.ico")))
        {
            Icon = new Icon(Path.Combine(_appDirectory, "WallpaperVideoLAN.HostControl.ico"));
        }

        var titleLabel = new Label
        {
            Text = "WallpaperVideoLAN",
            Font = new Font("Segoe UI", 18, FontStyle.Bold),
            ForeColor = Color.FromArgb(15, 23, 42),
            AutoSize = true,
            Location = new Point(24, 20)
        };

        var subtitleLabel = new Label
        {
            Text = "Controla el host local que sirve videos al telefono en tu red.",
            Font = new Font("Segoe UI", 10, FontStyle.Regular),
            ForeColor = Color.FromArgb(71, 85, 105),
            AutoSize = true,
            Location = new Point(26, 56)
        };

        var card = new Panel
        {
            Location = new Point(24, 92),
            Size = new Size(512, 120),
            BackColor = Color.White
        };
        card.Paint += (_, e) =>
        {
            using var pen = new Pen(Color.FromArgb(226, 232, 240));
            e.Graphics.DrawRectangle(pen, 0, 0, card.Width - 1, card.Height - 1);
        };

        var statusLabel = BuildCaptionLabel("Estado", new Point(18, 18));
        _statusValue = BuildValueLabel("Revisando...", new Point(120, 18), bold: true);

        var localUrlLabel = BuildCaptionLabel("URL local", new Point(18, 48));
        _localUrlValue = BuildValueLabel(BuildLocalUrl(), new Point(120, 48));

        var phoneUrlLabel = BuildCaptionLabel("URL telefono", new Point(18, 78));
        _phoneUrlValue = BuildValueLabel(BuildPhoneUrl(), new Point(120, 78));

        card.Controls.AddRange([statusLabel, _statusValue, localUrlLabel, _localUrlValue, phoneUrlLabel, _phoneUrlValue]);

        _hintLabel = new Label
        {
            Text = "Si el host no esta levantado, este panel lo inicia usando Node.js en segundo plano.",
            Font = new Font("Segoe UI", 9, FontStyle.Regular),
            ForeColor = Color.FromArgb(100, 116, 139),
            AutoSize = true,
            Location = new Point(24, 224)
        };

        _startButton = BuildButton("Iniciar host", new Point(24, 246), StartButtonClicked);
        _stopButton = BuildButton("Detener host", new Point(154, 246), StopButtonClicked);
        _openButton = BuildButton("Abrir web", new Point(284, 246), OpenButtonClicked);
        _copyButton = BuildButton("Copiar URL", new Point(414, 246), CopyButtonClicked);

        Controls.AddRange([titleLabel, subtitleLabel, card, _hintLabel, _startButton, _stopButton, _openButton, _copyButton]);

        _refreshTimer = new System.Windows.Forms.Timer
        {
            Interval = 3000
        };
        _refreshTimer.Tick += async (_, _) => await RefreshStateAsync();

        Shown += async (_, _) =>
        {
            await EnsureStartedAsync();
            await RefreshStateAsync();
            _refreshTimer.Start();
        };
    }

    private static Label BuildCaptionLabel(string text, Point location)
    {
        return new Label
        {
            Text = text,
            Font = new Font("Segoe UI", 9, FontStyle.Bold),
            ForeColor = Color.FromArgb(71, 85, 105),
            AutoSize = true,
            Location = location
        };
    }

    private static Label BuildValueLabel(string text, Point location, bool bold = false)
    {
        return new Label
        {
            Text = text,
            Font = new Font("Segoe UI", 9, bold ? FontStyle.Bold : FontStyle.Regular),
            ForeColor = Color.FromArgb(15, 23, 42),
            AutoSize = true,
            Location = location
        };
    }

    private static Button BuildButton(string text, Point location, EventHandler onClick)
    {
        var button = new Button
        {
            Text = text,
            Location = location,
            Size = new Size(112, 30),
            BackColor = Color.FromArgb(15, 23, 42),
            ForeColor = Color.White,
            FlatStyle = FlatStyle.Flat
        };
        button.FlatAppearance.BorderSize = 0;
        button.Click += onClick;
        return button;
    }

    private async void StartButtonClicked(object? sender, EventArgs e)
    {
        await EnsureStartedAsync(showErrors: true);
        await RefreshStateAsync();
    }

    private async void StopButtonClicked(object? sender, EventArgs e)
    {
        await StopServerAsync();
        await Task.Delay(600);
        await RefreshStateAsync();
    }

    private void OpenButtonClicked(object? sender, EventArgs e)
    {
        try
        {
            Process.Start(new ProcessStartInfo
            {
                FileName = BuildLocalUrl(),
                UseShellExecute = true
            });
        }
        catch (Exception ex)
        {
            MessageBox.Show($"No se pudo abrir el navegador.\n\n{ex.Message}", Text, MessageBoxButtons.OK, MessageBoxIcon.Error);
        }
    }

    private void CopyButtonClicked(object? sender, EventArgs e)
    {
        try
        {
            Clipboard.SetText(BuildPhoneUrl());
            _hintLabel.Text = "URL copiada al portapapeles.";
        }
        catch (Exception ex)
        {
            MessageBox.Show($"No se pudo copiar la URL.\n\n{ex.Message}", Text, MessageBoxButtons.OK, MessageBoxIcon.Error);
        }
    }

    private async Task EnsureStartedAsync(bool showErrors = false)
    {
        if (IsServerListening())
        {
            return;
        }

        if (!File.Exists(Path.Combine(_appDirectory, "src", "server.js")))
        {
            var message = $"No se encontro src\\server.js en:\n{_appDirectory}";
            _hintLabel.Text = message;
            if (showErrors)
            {
                MessageBox.Show(message, Text, MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
            return;
        }

        var nodePath = ResolveNodePath();
        if (nodePath is null)
        {
            var message = "No se encontro Node.js. Ejecuta primero el instalador para instalar dependencias.";
            _hintLabel.Text = message;
            if (showErrors)
            {
                MessageBox.Show(message, Text, MessageBoxButtons.OK, MessageBoxIcon.Warning);
            }
            return;
        }

        try
        {
            var startInfo = new ProcessStartInfo
            {
                FileName = nodePath,
                WorkingDirectory = _appDirectory,
                UseShellExecute = false,
                CreateNoWindow = true,
                WindowStyle = ProcessWindowStyle.Hidden
            };
            startInfo.ArgumentList.Add("src\\server.js");

            Process.Start(startInfo);

            for (var i = 0; i < 12; i++)
            {
                await Task.Delay(500);
                if (IsServerListening())
                {
                    _hintLabel.Text = "Host levantado en segundo plano.";
                    return;
                }
            }

            _hintLabel.Text = "No se pudo confirmar que el host haya arrancado.";
        }
        catch (Exception ex)
        {
            _hintLabel.Text = $"Error iniciando host: {ex.Message}";
            if (showErrors)
            {
                MessageBox.Show($"No se pudo iniciar el host.\n\n{ex.Message}", Text, MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }
    }

    private async Task StopServerAsync()
    {
        var targetScript = Path.Combine(_appDirectory, "src", "server.js").Replace("'", "''");
        var command = "$target = '" + targetScript + "'; " +
                      "Get-CimInstance Win32_Process | " +
                      "Where-Object { $_.Name -eq 'node.exe' -and $_.CommandLine -like ('*' + $target + '*') } | " +
                      "ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }";

        var startInfo = new ProcessStartInfo
        {
            FileName = "powershell",
            UseShellExecute = false,
            CreateNoWindow = true
        };
        startInfo.ArgumentList.Add("-NoProfile");
        startInfo.ArgumentList.Add("-ExecutionPolicy");
        startInfo.ArgumentList.Add("Bypass");
        startInfo.ArgumentList.Add("-Command");
        startInfo.ArgumentList.Add(command);

        using var process = Process.Start(startInfo);
        if (process is not null)
        {
            await process.WaitForExitAsync();
        }

        _hintLabel.Text = "Host detenido.";
    }

    private async Task RefreshStateAsync()
    {
        var running = IsServerListening();
        _statusValue.Text = running ? "Activo" : "Detenido";
        _statusValue.ForeColor = running ? Color.FromArgb(21, 128, 61) : Color.FromArgb(185, 28, 28);
        _localUrlValue.Text = BuildLocalUrl();
        _phoneUrlValue.Text = BuildPhoneUrl();
        _startButton.Enabled = !running;
        _stopButton.Enabled = running;
        _openButton.Enabled = true;
        _copyButton.Enabled = true;

        await Task.CompletedTask;
    }

    private static bool IsServerListening()
    {
        try
        {
            using var client = new TcpClient();
            var connectTask = client.ConnectAsync("127.0.0.1", Port);
            var completed = Task.WhenAny(connectTask, Task.Delay(250)).GetAwaiter().GetResult();
            return completed == connectTask && client.Connected;
        }
        catch
        {
            return false;
        }
    }

    private string BuildLocalUrl() => $"http://localhost:{Port}";

    private string BuildPhoneUrl()
    {
        var ip = GetPreferredLanAddress();
        return $"http://{ip}:{Port}";
    }

    private static string GetPreferredLanAddress()
    {
        foreach (var nic in NetworkInterface.GetAllNetworkInterfaces())
        {
            if (nic.OperationalStatus != OperationalStatus.Up)
            {
                continue;
            }

            if (nic.NetworkInterfaceType is NetworkInterfaceType.Loopback or NetworkInterfaceType.Tunnel)
            {
                continue;
            }

            var props = nic.GetIPProperties();
            foreach (var address in props.UnicastAddresses)
            {
                if (address.Address.AddressFamily != AddressFamily.InterNetwork)
                {
                    continue;
                }

                var text = address.Address.ToString();
                if (text.StartsWith("169.254.", StringComparison.Ordinal))
                {
                    continue;
                }

                return text;
            }
        }

        return "localhost";
    }

    private static string? ResolveNodePath()
    {
        var candidates = new List<string>();
        var path = Environment.GetEnvironmentVariable("PATH") ?? string.Empty;
        candidates.AddRange(path.Split(';', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Select(part => Path.Combine(part, "node.exe")));
        candidates.Add(Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles), "nodejs", "node.exe"));
        candidates.Add(Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86), "nodejs", "node.exe"));
        candidates.Add(Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "Programs", "nodejs", "node.exe"));

        return candidates.FirstOrDefault(File.Exists);
    }

    private static string ResolveAppDirectory()
    {
        var baseDir = AppContext.BaseDirectory.TrimEnd(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar);
        var candidates = new[]
        {
            baseDir,
            Path.GetFullPath(Path.Combine(baseDir, "..")),
            Path.GetFullPath(Path.Combine(baseDir, "..", ".."))
        };

        return candidates.FirstOrDefault(candidate => File.Exists(Path.Combine(candidate, "src", "server.js")))
               ?? baseDir;
    }
}
