const state = {
  query: '',
  rootDir: '',
  rootFolderName: 'Raíz',
  scannedAt: '',
  ffprobeAvailable: false,
  currentPath: '',
  currentView: null,
  displayedVideos: [],
  navStack: [],
  navIndex: -1,
  videosMode: 'direct',
  activeInline: null,
  scanStatus: null,
  scanPollHandle: null,
  scanStatusFailCount: 0
};

const dom = {
  statusText: document.getElementById('statusText'),
  searchInput: document.getElementById('searchInput'),
  grid: document.getElementById('grid'),
  cardTpl: document.getElementById('videoCardTemplate'),
  folderTpl: document.getElementById('folderItemTemplate'),
  connectionTpl: document.getElementById('connectionItemTemplate'),
  connectionList: document.getElementById('connectionList'),
  scanTitle: document.getElementById('scanTitle'),
  scanPercent: document.getElementById('scanPercent'),
  scanBar: document.getElementById('scanBar'),
  scanText: document.getElementById('scanText'),
  folderList: document.getElementById('folderList'),
  breadcrumb: document.getElementById('breadcrumb'),
  rescanBtn: document.getElementById('rescanBtn'),
  videoSectionTitle: document.getElementById('videoSectionTitle'),
  backBtn: document.getElementById('backBtn'),
  upBtn: document.getElementById('upBtn')
};

function formatDuration(seconds) {
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return '--:--';
  }

  const s = Math.floor(seconds % 60).toString().padStart(2, '0');
  const m = Math.floor((seconds / 60) % 60).toString().padStart(2, '0');
  const h = Math.floor(seconds / 3600);

  return h > 0 ? `${h}:${m}:${s}` : `${m}:${s}`;
}

function formatDate(iso) {
  if (!iso) return '-';
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleString();
}

function safeIncludes(value, query) {
  return String(value || '').toLowerCase().includes(query);
}

function getPathParts(folderPath) {
  if (!folderPath) return [];
  return folderPath.split('/').filter(Boolean);
}

function shortenPath(pathValue, max = 92) {
  const raw = String(pathValue || '');
  if (raw.length <= max) {
    return raw;
  }
  return `...${raw.slice(raw.length - max)}`;
}

async function copyToClipboard(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const input = document.createElement('input');
  input.value = text;
  document.body.appendChild(input);
  input.select();
  document.execCommand('copy');
  document.body.removeChild(input);
}

function buildConnectionItem(label, url) {
  const node = dom.connectionTpl.content.firstElementChild.cloneNode(true);
  const labelEl = node.querySelector('.connection-label');
  const linkEl = node.querySelector('.connection-link');
  const copyBtn = node.querySelector('.copy-link-btn');

  labelEl.textContent = label;
  linkEl.textContent = url;
  linkEl.href = url;

  copyBtn.addEventListener('click', async () => {
    try {
      await copyToClipboard(url);
      copyBtn.textContent = 'Copiado';
      setTimeout(() => {
        copyBtn.textContent = 'Copiar';
      }, 1200);
    } catch {
      copyBtn.textContent = 'Error';
      setTimeout(() => {
        copyBtn.textContent = 'Copiar';
      }, 1200);
    }
  });

  return node;
}

function renderConnections(payload) {
  dom.connectionList.innerHTML = '';
  const fragment = document.createDocumentFragment();
  const seenUrls = new Set();

  const localhostUrl = payload.localhostUrl || `http://localhost:${payload.port || 3000}`;
  fragment.appendChild(buildConnectionItem('Este equipo (localhost)', localhostUrl));
  seenUrls.add(localhostUrl);

  const lan = Array.isArray(payload.lan) ? payload.lan : [];
  for (const item of lan) {
    const url = item.url || `http://${item.address}:${payload.port || 3000}`;
    if (seenUrls.has(url)) {
      continue;
    }

    seenUrls.add(url);
    const label = `${item.interface || 'Interfaz'} (${item.address})`;
    fragment.appendChild(buildConnectionItem(label, url));
  }

  const hosts = Array.isArray(payload.hosts) ? payload.hosts : [];
  for (const host of hosts) {
    const url = host.url || `http://${host.address}:${payload.port || 3000}`;
    if (seenUrls.has(url)) {
      continue;
    }

    seenUrls.add(url);
    const label = `Host Wallpaper activo (${host.address})`;
    fragment.appendChild(buildConnectionItem(label, url));
  }

  if (lan.length === 0 && hosts.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'empty-row';
    empty.textContent = 'No se detectaron hosts activos en LAN. Revisa Wi-Fi o cable de red.';
    fragment.appendChild(empty);
  }

  dom.connectionList.appendChild(fragment);
}

function renderScanStatus(status) {
  const fallback = {
    inProgress: false,
    percent: 0,
    discoveredEntries: 0,
    processedEntries: 0,
    foundVideos: 0,
    currentPath: '',
    message: 'Esperando escaneo...'
  };

  const data = { ...fallback, ...(status || {}) };
  const percent = Math.max(0, Math.min(100, Number(data.percent || 0)));
  const scanned = Number(data.processedEntries || 0);
  const discovered = Number(data.discoveredEntries || 0);
  const found = Number(data.foundVideos || 0);

  dom.scanPercent.textContent = `${percent}%`;
  dom.scanBar.style.width = `${percent}%`;
  dom.scanTitle.textContent = data.inProgress
    ? 'Cargando archivos...'
    : 'Progreso de carga de archivos';

  const progressLine = `${scanned}/${Math.max(discovered, scanned)} entradas revisadas | ${found} video(s) detectado(s)`;
  const pathLine = data.currentPath ? ` | ${shortenPath(data.currentPath)}` : '';
  dom.scanText.textContent = `${data.message || ''} (${progressLine}${pathLine})`;
}

function renderBreadcrumb() {
  const parts = getPathParts(state.currentPath);
  dom.breadcrumb.innerHTML = '';

  const rootChip = document.createElement('button');
  rootChip.type = 'button';
  rootChip.className = 'crumb';
  rootChip.textContent = state.rootFolderName;
  rootChip.addEventListener('click', () => openFolder(''));
  dom.breadcrumb.appendChild(rootChip);

  let current = '';
  for (const part of parts) {
    current = current ? `${current}/${part}` : part;

    const sep = document.createElement('span');
    sep.className = 'crumb-sep';
    sep.textContent = '›';
    dom.breadcrumb.appendChild(sep);

    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'crumb';
    chip.textContent = part;
    chip.addEventListener('click', () => openFolder(current));
    dom.breadcrumb.appendChild(chip);
  }
}

function updateNavButtons() {
  dom.backBtn.disabled = state.navIndex <= 0;
  const hasParent = Boolean(state.currentView?.folder?.parent || state.currentPath);
  dom.upBtn.disabled = !hasParent;
}

function stopInlinePlayback(active) {
  if (!active) {
    return;
  }

  active.player.pause();
  active.player.removeAttribute('src');
  active.player.load();
  active.player.classList.add('hidden');
  active.playBtn.textContent = 'Reproducir';

  if (!active.thumb.classList.contains('hidden')) {
    active.thumb.classList.remove('hidden');
  } else {
    active.placeholder.classList.remove('hidden');
  }
}

function startInlinePlayback(video, refs) {
  if (state.activeInline && state.activeInline.videoId !== video.id) {
    stopInlinePlayback(state.activeInline);
    state.activeInline = null;
  }

  const alreadyActive = state.activeInline && state.activeInline.videoId === video.id;
  if (alreadyActive) {
    stopInlinePlayback(state.activeInline);
    state.activeInline = null;
    return;
  }

  refs.thumb.classList.add('hidden');
  refs.placeholder.classList.add('hidden');
  refs.player.classList.remove('hidden');
  refs.player.src = `/api/video/${encodeURIComponent(video.id)}/stream`;
  refs.playBtn.textContent = 'Cerrar';

  refs.player.play().catch(() => {
    // Móvil puede requerir interacción adicional.
  });

  state.activeInline = {
    videoId: video.id,
    ...refs
  };
}

function buildVideoCard(video) {
  const node = dom.cardTpl.content.firstElementChild.cloneNode(true);
  const title = node.querySelector('.title');
  const meta = node.querySelector('.meta');
  const thumb = node.querySelector('.thumb');
  const placeholder = node.querySelector('.placeholder');
  const player = node.querySelector('.inline-player');
  const playBtn = node.querySelector('.play-btn');

  title.textContent = video.fileName;
  meta.textContent = `Carpeta: ${video.folderRelative} | Duración: ${formatDuration(video.durationSeconds)}`;

  thumb.src = `/api/thumbnail/${encodeURIComponent(video.id)}`;
  thumb.addEventListener('load', () => {
    thumb.classList.remove('hidden');
    placeholder.classList.add('hidden');
  });

  thumb.addEventListener('error', () => {
    thumb.classList.add('hidden');
    placeholder.classList.remove('hidden');
  });

  const refs = { thumb, placeholder, player, playBtn };
  playBtn.addEventListener('click', () => startInlinePlayback(video, refs));

  return node;
}

function getFilteredFolders(folders) {
  const q = state.query.trim().toLowerCase();
  if (!q) return folders;

  return folders.filter((folder) => safeIncludes(folder.name, q) || safeIncludes(folder.path, q));
}

function getFilteredVideos(videos) {
  const q = state.query.trim().toLowerCase();
  if (!q) return videos;

  return videos.filter((video) => safeIncludes(video.fileName, q) || safeIncludes(video.folderRelative, q));
}

function renderFolderList() {
  dom.folderList.innerHTML = '';

  if (!state.currentView) {
    return;
  }

  const folders = getFilteredFolders(state.currentView.childFolders || []);

  if (folders.length === 0) {
    dom.folderList.innerHTML = '<p class="empty-row">No hay subcarpetas con videos.</p>';
    return;
  }

  const fragment = document.createDocumentFragment();
  for (const folder of folders) {
    const row = dom.folderTpl.content.firstElementChild.cloneNode(true);
    const mainBtn = row.querySelector('.folder-main-btn');
    const name = row.querySelector('.folder-name');
    const meta = row.querySelector('.folder-meta');
    const videosBtn = row.querySelector('.folder-videos-btn');

    name.textContent = folder.name;
    meta.textContent = `${folder.totalVideos} video(s) en total`;

    mainBtn.addEventListener('click', () => openFolder(folder.path));
    videosBtn.addEventListener('click', () => loadFolderVideos(folder.path, true));

    fragment.appendChild(row);
  }

  dom.folderList.appendChild(fragment);
}

function renderVideos(videos) {
  if (state.activeInline) {
    stopInlinePlayback(state.activeInline);
    state.activeInline = null;
  }

  dom.grid.innerHTML = '';

  const filtered = getFilteredVideos(videos);
  if (filtered.length === 0) {
    dom.grid.innerHTML = '<p class="empty-row">No hay videos para mostrar.</p>';
    return;
  }

  const fragment = document.createDocumentFragment();
  for (const video of filtered) {
    fragment.appendChild(buildVideoCard(video));
  }

  dom.grid.appendChild(fragment);
}

function updateStatus() {
  const folder = state.currentView?.folder;
  const folderLabel = folder ? (folder.path || state.rootFolderName) : state.rootFolderName;

  dom.statusText.textContent = `${folderLabel} | Escaneado: ${formatDate(state.scannedAt)}${state.ffprobeAvailable ? '' : ' | sin ffprobe (duración parcial)'}`;
}

async function loadSummary() {
  const response = await fetch('/api/videos');
  if (!response.ok) {
    throw new Error('No se pudo cargar el resumen de biblioteca.');
  }

  const data = await response.json();
  state.rootDir = data.rootDir || '';
  state.rootFolderName = data.rootFolderName || 'Raíz';
  state.scannedAt = data.scannedAt || '';
  state.ffprobeAvailable = Boolean(data.ffprobeAvailable);
}

async function loadConnections() {
  const response = await fetch('/api/network');
  if (!response.ok) {
    throw new Error('No se pudieron obtener conexiones locales.');
  }

  const data = await response.json();
  renderConnections(data);
}

async function loadScanStatus() {
  const response = await fetch('/api/scan-status');
  if (!response.ok) {
    throw new Error('No se pudo leer el progreso de escaneo.');
  }

  const data = await response.json();
  state.scanStatusFailCount = 0;
  state.scanStatus = data;
  renderScanStatus(data);
}

function handleScanStatusError() {
  state.scanStatusFailCount += 1;

  const lastKnown = state.scanStatus || {
    inProgress: false,
    percent: 0,
    discoveredEntries: 0,
    processedEntries: 0,
    foundVideos: 0,
    currentPath: '',
    message: 'Esperando estado de escaneo...'
  };

  renderScanStatus({
    ...lastKnown,
    message: `Reconectando estado de escaneo... (intento ${state.scanStatusFailCount})`
  });
}

async function openFolder(folderPath, options = {}) {
  const { fromHistory = false } = options;
  const response = await fetch(`/api/folder?path=${encodeURIComponent(folderPath || '')}`);
  if (!response.ok) {
    throw new Error('No se pudo abrir la carpeta seleccionada.');
  }

  const data = await response.json();
  state.currentPath = data.folder.path || '';
  state.currentView = data;
  state.videosMode = 'direct';
  state.displayedVideos = data.videos || [];

  if (!fromHistory) {
    const currentHistoryPath = state.navStack[state.navIndex];
    if (currentHistoryPath !== state.currentPath) {
      state.navStack = state.navStack.slice(0, state.navIndex + 1);
      state.navStack.push(state.currentPath);
      state.navIndex = state.navStack.length - 1;
    }
  }

  dom.videoSectionTitle.textContent = `Videos de ${data.folder.path || state.rootFolderName}`;
  renderBreadcrumb();
  renderFolderList();
  renderVideos(state.displayedVideos);
  updateStatus();
  updateNavButtons();
}

async function loadFolderVideos(folderPath, recursive) {
  const response = await fetch(`/api/folder/videos?path=${encodeURIComponent(folderPath || '')}&recursive=${recursive ? 'true' : 'false'}`);
  if (!response.ok) {
    throw new Error('No se pudo cargar los videos de la carpeta.');
  }

  const data = await response.json();
  state.videosMode = recursive ? 'recursive' : 'direct';
  state.displayedVideos = data.videos || [];

  const label = data.folderPath || state.rootFolderName;
  dom.videoSectionTitle.textContent = recursive
    ? `Todos los videos dentro de ${label}`
    : `Videos directos de ${label}`;

  renderVideos(state.displayedVideos);
}

async function rescan() {
  dom.statusText.textContent = 'Reescaneando...';
  const response = await fetch('/api/rescan', { method: 'POST' });

  if (!response.ok) {
    throw new Error('Error al reescanear.');
  }

  await loadSummary();
  await loadScanStatus().catch(() => {});
  await openFolder(state.currentPath || '', { fromHistory: true });
}

function wireEvents() {
  dom.searchInput.addEventListener('input', (event) => {
    state.query = event.target.value;
    renderFolderList();
    renderVideos(state.displayedVideos);
  });

  dom.rescanBtn.addEventListener('click', () => {
    rescan().catch((error) => {
      dom.statusText.textContent = error.message;
    });
  });

  dom.backBtn.addEventListener('click', () => {
    if (state.navIndex <= 0) {
      return;
    }

    state.navIndex -= 1;
    const path = state.navStack[state.navIndex] || '';
    openFolder(path, { fromHistory: true }).catch((error) => {
      dom.statusText.textContent = error.message;
    });
  });

  dom.upBtn.addEventListener('click', () => {
    const parent = state.currentView?.folder?.parent || '';
    openFolder(parent).catch((error) => {
      dom.statusText.textContent = error.message;
    });
  });
}

async function bootstrap() {
  wireEvents();
  renderScanStatus();
  await loadConnections().catch(() => {
    dom.connectionList.innerHTML = '<p class="empty-row">No se pudo detectar la red local.</p>';
  });
  await loadScanStatus().catch(handleScanStatusError);

  if (state.scanPollHandle) {
    clearInterval(state.scanPollHandle);
  }
  state.scanPollHandle = setInterval(() => {
    loadScanStatus().catch(handleScanStatusError);
  }, 1200);

  await loadSummary();
  await openFolder('');
}

bootstrap().catch((error) => {
  dom.statusText.textContent = error.message;
});
