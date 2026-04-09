const fs = require('fs/promises');
const fsSync = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { hashPath, isSupportedVideo } = require('./utils');

class VideoIndexer {
  constructor({ rootDir, enableDurationProbe }) {
    this.rootDir = rootDir;
    this.enableDurationProbe = enableDurationProbe;
    this.videos = [];
    this.videoMap = new Map();
    this.scannedAt = null;
    this.scanInProgress = false;
    this.ffprobeAvailable = this.enableDurationProbe ? this.#isFfprobeAvailable() : false;
    this.folderMap = new Map();
    this.scanStatus = {
      inProgress: false,
      startedAt: null,
      finishedAt: null,
      discoveredEntries: 0,
      processedEntries: 0,
      foundVideos: 0,
      currentPath: '',
      percent: 0,
      message: 'Esperando escaneo'
    };
  }

  #isFfprobeAvailable() {
    try {
      const result = spawnSync('ffprobe', ['-version'], { stdio: 'ignore', timeout: 1200 });
      return result.status === 0;
    } catch {
      return false;
    }
  }

  async scan() {
    if (this.scanInProgress) {
      return this.getSummary();
    }

    this.scanInProgress = true;
    this.scanStatus = {
      inProgress: true,
      startedAt: new Date().toISOString(),
      finishedAt: null,
      discoveredEntries: 0,
      processedEntries: 0,
      foundVideos: 0,
      currentPath: this.rootDir,
      percent: 0,
      message: 'Escaneando archivos...'
    };

    try {
      await this.#ensureRootExists();
      const videos = await this.#walkAndCollectVideos();

      this.videos = videos;
      this.videoMap = new Map(videos.map((item) => [item.id, item]));
      this.folderMap = this.#buildFolderMap(videos);
      this.scannedAt = new Date().toISOString();
      this.scanStatus = {
        ...this.scanStatus,
        inProgress: false,
        finishedAt: this.scannedAt,
        percent: 100,
        foundVideos: videos.length,
        message: `Escaneo completo (${videos.length} video(s))`
      };

      return this.getSummary();
    } catch (error) {
      this.scanStatus = {
        ...this.scanStatus,
        inProgress: false,
        finishedAt: new Date().toISOString(),
        message: `Error: ${error.message || 'fallo de escaneo'}`
      };
      throw error;
    } finally {
      this.scanInProgress = false;
    }
  }

  async #ensureRootExists() {
    const stat = await fs.stat(this.rootDir).catch(() => null);

    if (!stat || !stat.isDirectory()) {
      throw new Error(`La carpeta raíz no existe o no es válida: ${this.rootDir}`);
    }
  }

  async #walkAndCollectVideos() {
    const results = [];
    const pendingDirs = [this.rootDir];

    while (pendingDirs.length > 0) {
      const currentDir = pendingDirs.pop();
      this.scanStatus.currentPath = currentDir;
      let entries;

      try {
        entries = await fs.readdir(currentDir, { withFileTypes: true });
        this.scanStatus.discoveredEntries += entries.length;
      } catch {
        continue;
      }

      for (const entry of entries) {
        const absolutePath = path.join(currentDir, entry.name);
        this.scanStatus.processedEntries += 1;
        this.scanStatus.currentPath = absolutePath;

        const discovered = Math.max(this.scanStatus.discoveredEntries, 1);
        const rawPercent = Math.floor((this.scanStatus.processedEntries / discovered) * 100);
        this.scanStatus.percent = Math.max(this.scanStatus.percent, Math.min(rawPercent, 99));

        if (entry.isDirectory()) {
          pendingDirs.push(absolutePath);
          continue;
        }

        if (!entry.isFile() || !isSupportedVideo(absolutePath)) {
          continue;
        }

        const stat = await fs.stat(absolutePath).catch(() => null);
        if (!stat || !stat.isFile()) {
          continue;
        }

        const relativePath = path.relative(this.rootDir, absolutePath);
        const parts = relativePath.split(path.sep);
        const workshopFolder = parts.length > 1 ? parts[0] : 'root';

        const video = {
          id: hashPath(absolutePath),
          name: path.parse(entry.name).name,
          fileName: entry.name,
          ext: path.extname(entry.name).toLowerCase(),
          absolutePath,
          relativePath,
          folderRelative: path.dirname(relativePath),
          workshopFolder,
          sizeBytes: stat.size,
          modifiedAt: stat.mtime.toISOString(),
          durationSeconds: this.#tryGetDuration(absolutePath)
        };

        results.push(video);
        this.scanStatus.foundVideos = results.length;
      }
    }

    results.sort((a, b) => a.relativePath.localeCompare(b.relativePath));
    return results;
  }

  #tryGetDuration(filePath) {
    if (!this.ffprobeAvailable) {
      return null;
    }

    try {
      const probe = spawnSync(
        'ffprobe',
        [
          '-v',
          'error',
          '-show_entries',
          'format=duration',
          '-of',
          'default=noprint_wrappers=1:nokey=1',
          filePath
        ],
        { encoding: 'utf8', timeout: 2500 }
      );

      if (probe.status !== 0 || !probe.stdout) {
        return null;
      }

      const seconds = Number.parseFloat(probe.stdout.trim());
      return Number.isFinite(seconds) && seconds > 0 ? Math.round(seconds) : null;
    } catch {
      return null;
    }
  }

  getById(id) {
    return this.videoMap.get(id) || null;
  }

  getScanStatus() {
    return { ...this.scanStatus };
  }

  #normalizeFolderPath(relativeFolder = '') {
    if (!relativeFolder || relativeFolder === '.') {
      return '';
    }

    const normalized = path.normalize(relativeFolder).replace(/[\\/]+/g, '/');

    if (
      normalized.startsWith('..') ||
      normalized.includes('/../') ||
      normalized === '..' ||
      path.isAbsolute(normalized)
    ) {
      return null;
    }

    return normalized === '.' ? '' : normalized;
  }

  #ensureFolderNode(map, folderPath) {
    if (!map.has(folderPath)) {
      const name = folderPath === '' ? path.basename(this.rootDir) || 'Raíz' : folderPath.split('/').pop();
      const parent = folderPath.includes('/') ? folderPath.slice(0, folderPath.lastIndexOf('/')) : '';

      map.set(folderPath, {
        path: folderPath,
        name,
        parent,
        childFolders: new Set(),
        directVideos: [],
        totalVideos: 0
      });
    }
    return map.get(folderPath);
  }

  #buildFolderMap(videos) {
    const map = new Map();
    this.#ensureFolderNode(map, '');

    for (const video of videos) {
      const folder = video.folderRelative === '.' ? '' : video.folderRelative.replace(/[\\/]+/g, '/');
      const parts = folder ? folder.split('/') : [];
      let current = '';
      const ancestry = [''];

      for (const part of parts) {
        const parent = current;
        current = current ? `${current}/${part}` : part;
        this.#ensureFolderNode(map, current);
        this.#ensureFolderNode(map, parent).childFolders.add(current);
        ancestry.push(current);
      }

      const folderNode = this.#ensureFolderNode(map, folder);
      folderNode.directVideos.push(video.id);

      for (const ancestor of ancestry) {
        this.#ensureFolderNode(map, ancestor).totalVideos += 1;
      }
    }

    return map;
  }

  getFolderView(relativeFolder = '') {
    const normalized = this.#normalizeFolderPath(relativeFolder);
    if (normalized === null) {
      return null;
    }

    const node = this.folderMap.get(normalized);
    if (!node) {
      return null;
    }

    const childFolders = Array.from(node.childFolders)
      .map((childPath) => {
        const child = this.folderMap.get(childPath);
        return child
          ? {
              path: child.path,
              name: child.name,
              totalVideos: child.totalVideos,
              directVideosCount: child.directVideos.length
            }
          : null;
      })
      .filter(Boolean)
      .sort((a, b) => a.name.localeCompare(b.name));

    const videos = node.directVideos
      .map((id) => this.videoMap.get(id))
      .filter(Boolean)
      .sort((a, b) => a.fileName.localeCompare(b.fileName));

    return {
      folder: {
        path: node.path,
        name: node.name,
        parent: node.parent,
        totalVideos: node.totalVideos,
        directVideosCount: node.directVideos.length
      },
      childFolders,
      videos
    };
  }

  getVideosForFolder(relativeFolder = '', recursive = true) {
    const normalized = this.#normalizeFolderPath(relativeFolder);
    if (normalized === null) {
      return null;
    }

    const node = this.folderMap.get(normalized);
    if (!node) {
      return null;
    }

    if (!recursive) {
      return node.directVideos.map((id) => this.videoMap.get(id)).filter(Boolean);
    }

    const prefix = normalized ? `${normalized}/` : '';
    return this.videos.filter((video) => {
      const folder = video.folderRelative === '.' ? '' : video.folderRelative.replace(/[\\/]+/g, '/');
      return folder === normalized || folder.startsWith(prefix);
    });
  }

  getSummary() {
    const foldersMap = new Map();

    for (const video of this.videos) {
      if (!foldersMap.has(video.workshopFolder)) {
        foldersMap.set(video.workshopFolder, {
          folder: video.workshopFolder,
          count: 0,
          sampleVideoId: video.id,
          sampleName: video.fileName
        });
      }

      foldersMap.get(video.workshopFolder).count += 1;
    }

    return {
      rootDir: this.rootDir,
      scannedAt: this.scannedAt,
      count: this.videos.length,
      ffprobeAvailable: this.ffprobeAvailable,
      videos: this.videos,
      foldersWithVideo: Array.from(foldersMap.values()).sort((a, b) => a.folder.localeCompare(b.folder)),
      rootFolderName: path.basename(this.rootDir) || 'Raíz'
    };
  }
}

module.exports = VideoIndexer;
