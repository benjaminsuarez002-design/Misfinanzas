const fs = require('fs/promises');
const fsSync = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

class ThumbnailService {
  constructor({ cacheDir }) {
    this.cacheDir = cacheDir;
    this.ffmpegAvailable = this.#isFfmpegAvailable();
  }

  #isFfmpegAvailable() {
    try {
      const result = spawnSync('ffmpeg', ['-version'], { stdio: 'ignore', timeout: 1200 });
      return result.status === 0;
    } catch {
      return false;
    }
  }

  async init() {
    await fs.mkdir(this.cacheDir, { recursive: true });
  }

  async getThumbnailPath(video) {
    if (!this.ffmpegAvailable) {
      return null;
    }

    const outputPath = path.join(this.cacheDir, `${video.id}.jpg`);

    if (fsSync.existsSync(outputPath)) {
      return outputPath;
    }

    const args = ['-y', '-ss', '00:00:01', '-i', video.absolutePath, '-frames:v', '1', '-vf', 'scale=480:-1', outputPath];
    const result = spawnSync('ffmpeg', args, { stdio: 'ignore', timeout: 6000 });

    if (result.status === 0 && fsSync.existsSync(outputPath)) {
      return outputPath;
    }

    return null;
  }
}

module.exports = ThumbnailService;
