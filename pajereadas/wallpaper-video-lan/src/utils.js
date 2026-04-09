const path = require('path');
const crypto = require('crypto');

const VIDEO_EXTENSIONS = new Set(['.mp4', '.webm', '.mkv', '.avi', '.mov']);

function isSupportedVideo(filePath) {
  return VIDEO_EXTENSIONS.has(path.extname(filePath).toLowerCase());
}

function hashPath(filePath) {
  return crypto.createHash('sha1').update(filePath).digest('hex');
}

function formatBytes(size) {
  if (!Number.isFinite(size) || size < 0) {
    return '0 B';
  }

  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let value = size;
  let index = 0;

  while (value >= 1024 && index < units.length - 1) {
    value /= 1024;
    index += 1;
  }

  return `${value.toFixed(value >= 100 || index === 0 ? 0 : 1)} ${units[index]}`;
}

module.exports = {
  VIDEO_EXTENSIONS,
  isSupportedVideo,
  hashPath,
  formatBytes
};
