const express = require('express');
const fs = require('fs');
const fsPromises = require('fs/promises');
const path = require('path');
const os = require('os');

const config = require('./config');
const VideoIndexer = require('./videoIndexer');
const ThumbnailService = require('./thumbnailService');

const app = express();

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

app.get('/api/network', (req, res) => {
  try {
    const interfaces = os.networkInterfaces();
    const lan = [];

    for (const [ifaceName, records] of Object.entries(interfaces)) {
      for (const record of records || []) {
        const isIpv4 = record.family === 'IPv4' || record.family === 4;
        if (!isIpv4 || record.internal || !record.address) {
          continue;
        }

        lan.push({
          interface: ifaceName,
          address: record.address,
          url: `http://${record.address}:${config.port}`
        });
      }
    }

    lan.sort((a, b) => a.address.localeCompare(b.address));

    res.json({
      host: config.host,
      port: config.port,
      localhostUrl: `http://localhost:${config.port}`,
      lan
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

