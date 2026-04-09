const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const defaultRoot = 'C:\\';
const envRoot = (process.env.WALLPAPER_ROOT || '').trim();

const config = {
  host: process.env.HOST || '0.0.0.0',
  port: Number(process.env.PORT || 3000),
  wallpaperRoot: path.resolve(envRoot || defaultRoot),
  scanIntervalSeconds: Number(process.env.SCAN_INTERVAL_SECONDS || 180),
  enableDurationProbe: String(process.env.ENABLE_DURATION_PROBE || 'true').toLowerCase() === 'true'
};

module.exports = config;
