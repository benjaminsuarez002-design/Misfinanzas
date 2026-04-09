const express = require('express');
const fs = require('fs');
const fsPromises = require('fs/promises');
const path = require('path');
const os = require('os');
const { execFile } = require('child_process');
const { promisify } = require('util');

const config = require('./config');
const VideoIndexer = require('./videoIndexer');
const ThumbnailService = require('./thumbnailService');

const app = express();
const execFileAsync = promisify(execFile);

const indexer = new VideoIndexer({
  rootDir: config.wallpaperRoot,
  enableDurationProbe: config.enableDurationProbe
});

const thumbnailService = new ThumbnailService({
  cacheDir: path.resolve(process.cwd(), '.cache', 'thumbnails')
});

const MIME_TYPES = {
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mkv': 'video/x-matroska',
  '.avi': 'video/x-msvideo',
  '.mov': 'video/quicktime'
};

function resolveMime(filePath) {
  return MIME_TYPES[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
}

function isValidIpv4(address) {
  if (!address || typeof address !== 'string') return false;
  const parts = address.split('.');
  if (parts.length !== 4) return false;

  return parts.every((part) => {
    if (!/^\d+$/.test(part)) return false;
    const num = Number(part);
    return num >= 0 && num <= 255;
  });
}

function compareIpv4(a, b) {
  const aParts = String(a || '').split('.').map((part) => Number(part) || 0);
  const bParts = String(b || '').split('.').map((part) => Number(part) || 0);

  for (let i = 0; i < 4; i += 1) {
    const diff = aParts[i] - bParts[i];
    if (diff !== 0) return diff;
  }

  return 0;
}

function getLanInterfaces() {
  const interfaces = os.networkInterfaces();
  const lan = [];
  const seen = new Set();

  for (const [ifaceName, records] of Object.entries(interfaces)) {
    for (const record of records || []) {
      const isIpv4 = record.family === 'IPv4' || record.family === 4;
      if (!isIpv4 || record.internal || !isValidIpv4(record.address)) {
        continue;
      }

      if (seen.has(record.address)) {
        continue;
      }

      seen.add(record.address);
      lan.push({
        interface: ifaceName,
        address: record.address,
        url: `http://${record.address}:${config.port}`
      });
    }
  }

  lan.sort((a, b) => compareIpv4(a.address, b.address));
  return lan;
}

function parseArpTable(rawText) {
  const entries = [];
  const lines = String(rawText || '').split(/\r?\n/);

  for (const line of lines) {
    const match = line.trim().match(/^(\d{1,3}(?:\.\d{1,3}){3})\s+([0-9a-fA-F:-]{11,23})\s+(\S+)/);
    if (!match) {
      continue;
    }

    const address = match[1];
    const mac = match[2].toLowerCase().replace(/-/g, ':');
    const type = match[3].toLowerCase();
    const octets = address.split('.').map((part) => Number(part));
    const firstOctet = octets[0];
    const lastOctet = octets[3];

    if (!isValidIpv4(address) || address.startsWith('127.') || address === '0.0.0.0') {
      continue;
    }
    if (firstOctet >= 224 || firstOctet === 0 || firstOctet === 255 || lastOctet === 255) {
      continue;
    }

    if (mac === 'ff:ff:ff:ff:ff:ff' || mac === '00:00:00:00:00:00') {
      continue;
    }

    entries.push({ address, mac, type });
  }

  return entries;
}

async function detectLanDevices(excludeAddresses = []) {
  try {
    const command = process.platform === 'win32' ? 'arp' : '/usr/sbin/arp';
    const args = process.platform === 'win32' ? ['-a'] : ['-an'];
    const { stdout } = await execFileAsync(command, args, {
      windowsHide: true,
      timeout: 1800,
      maxBuffer: 1024 * 1024
    });

    const excluded = new Set(excludeAddresses);
    const byIp = new Map();

    for (const entry of parseArpTable(stdout)) {
      if (excluded.has(entry.address)) {
        continue;
      }

      if (!byIp.has(entry.address)) {
        byIp.set(entry.address, entry);
      }
    }

    return [...byIp.values()].sort((a, b) => compareIpv4(a.address, b.address));
  } catch {
    return [];
  }
}

async function probeWallpaperHost(address, port) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 700);

  try {
    const response = await fetch(`http://${address}:${port}/api/health`, {
      method: 'GET',
      signal: controller.signal
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json().catch(() => null);
    if (!data || data.ok !== true) {
      return null;
    }

    return {
      address,
      url: `http://${address}:${port}`,
      port: Number(data.port || port)
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function detectWallpaperHosts(addresses, port) {
  const unique = [...new Set((addresses || []).filter(isValidIpv4))];
  if (unique.length === 0) {
    return [];
  }

  const checks = unique.map((address) => probeWallpaperHost(address, port));
  const results = await Promise.all(checks);

  return results
    .filter(Boolean)
    .sort((a, b) => compareIpv4(a.address, b.address));
}

async function streamVideo(req, res, filePath) {
  const stats = await fsPromises.stat(filePath);
  const fileSize = stats.size;
  const range = req.headers.range;

  if (!range) {
    res.writeHead(200, {
      'Content-Type': resolveMime(filePath),
      'Content-Length': fileSize,
      'Accept-Ranges': 'bytes'
    });

    fs.createReadStream(filePath).pipe(res);
    return;
  }

  const [rawStart, rawEnd] = range.replace(/bytes=/, '').split('-');
  const start = Number.parseInt(rawStart, 10);
  const end = rawEnd ? Number.parseInt(rawEnd, 10) : fileSize - 1;

  if (!Number.isFinite(start) || !Number.isFinite(end) || start < 0 || end >= fileSize || start > end) {
    res.status(416).json({ error: 'Rango inválido.' });
    return;
  }

  const chunkSize = end - start + 1;
  const stream = fs.createReadStream(filePath, { start, end });

  res.writeHead(206, {
    'Content-Range': `bytes ${start}-${end}/${fileSize}`,
    'Accept-Ranges': 'bytes',
    'Content-Length': chunkSize,
    'Content-Type': resolveMime(filePath)
  });

  stream.pipe(res);
}

app.use(express.json());
app.use(express.static(path.resolve(process.cwd(), 'public')));

app.get('/api/videos', async (req, res) => {
  try {
    const data = indexer.getSummary();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message || 'No se pudo listar videos.' });
  }
});

app.get('/api/scan-status', (req, res) => {
  try {
    res.json(indexer.getScanStatus());
  } catch (error) {
    res.status(500).json({ error: error.message || 'No se pudo obtener estado de escaneo.' });
  }
});

app.get('/api/network', async (req, res) => {
  try {
    const lan = getLanInterfaces();
    const excluded = new Set(['127.0.0.1', ...lan.map((entry) => entry.address)]);
    const devices = await detectLanDevices([...excluded]);
    const hosts = await detectWallpaperHosts(
      devices.map((entry) => entry.address),
      config.port
    );

    res.json({
      host: config.host,
      port: config.port,
      localhostUrl: `http://localhost:${config.port}`,
      lan,
      hosts
    });
  } catch (error) {
    res.status(500).json({ error: error.message || 'No se pudo obtener la red local.' });
  }
});
app.get('/api/folder', (req, res) => {
  try {
    const folderPath = typeof req.query.path === 'string' ? req.query.path : '';
    const view = indexer.getFolderView(folderPath);

    if (!view) {
      res.status(404).json({ error: 'Carpeta no encontrada.' });
      return;
    }

    res.json(view);
  } catch (error) {
    res.status(500).json({ error: error.message || 'No se pudo abrir la carpeta.' });
  }
});

app.get('/api/folder/videos', (req, res) => {
  try {
    const folderPath = typeof req.query.path === 'string' ? req.query.path : '';
    const recursive = String(req.query.recursive || 'true').toLowerCase() !== 'false';
    const videos = indexer.getVideosForFolder(folderPath, recursive);

    if (!videos) {
      res.status(404).json({ error: 'Carpeta no encontrada.' });
      return;
    }

    res.json({
      folderPath,
      recursive,
      count: videos.length,
      videos
    });
  } catch (error) {
    res.status(500).json({ error: error.message || 'No se pudieron obtener videos de la carpeta.' });
  }
});

app.get('/api/video/:id/stream', async (req, res) => {
  try {
    const video = indexer.getById(req.params.id);

    if (!video) {
      res.status(404).json({ error: 'Video no encontrado.' });
      return;
    }

    await streamVideo(req, res, video.absolutePath);
  } catch (error) {
    res.status(500).json({ error: error.message || 'Error de streaming.' });
  }
});

app.get('/api/thumbnail/:id', async (req, res) => {
  try {
    const video = indexer.getById(req.params.id);

    if (!video) {
      res.status(404).json({ error: 'Video no encontrado.' });
      return;
    }

    const thumbnailPath = await thumbnailService.getThumbnailPath(video);

    if (!thumbnailPath) {
      res.status(404).json({ error: 'Miniatura no disponible.' });
      return;
    }

    res.sendFile(thumbnailPath);
  } catch (error) {
    res.status(500).json({ error: error.message || 'No se pudo obtener miniatura.' });
  }
});

app.post('/api/rescan', async (req, res) => {
  try {
    const summary = await indexer.scan();
    res.json({ ok: true, ...summary });
  } catch (error) {
    res.status(500).json({ error: error.message || 'No se pudo reescanear.' });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ ok: true, host: config.host, port: config.port, rootDir: config.wallpaperRoot });
});

async function bootstrap() {
  try {
    await thumbnailService.init();
    app.listen(config.port, config.host, () => {
      console.log(`Servidor listo en http://${config.host}:${config.port}`);
      console.log(`Carpeta raíz: ${config.wallpaperRoot}`);
    });

    indexer.scan().catch((error) => {
      console.error('[scan inicial] error:', error.message);
    });

    setInterval(async () => {
      try {
        await indexer.scan();
      } catch (error) {
        console.error('[scan] error:', error.message);
      }
    }, Math.max(30, config.scanIntervalSeconds) * 1000);
  } catch (error) {
    console.error('No se pudo iniciar el servidor:', error.message);
    process.exit(1);
  }
}

bootstrap();

