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

    try {
      await this.#ensureRootExists();
      const videos = await this.#walkAndCollectVideos();

      this.videos = videos;
      this.videoMap = new Map(videos.map((item) => [item.id, item]));
      this.scannedAt = new Date().toISOString();

      return this.getSummary();
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
      let entries;

      try {
        entries = await fs.readdir(currentDir, { withFileTypes: true });
      } catch {
        continue;
      }

      for (const entry of entries) {
        const absolutePath = path.join(currentDir, entry.name);

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
      foldersWithVideo: Array.from(foldersMap.values()).sort((a, b) => a.folder.localeCompare(b.folder))
    };
  }
}

module.exports = VideoIndexer;
