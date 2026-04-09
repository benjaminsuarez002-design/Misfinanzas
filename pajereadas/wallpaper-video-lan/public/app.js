const state = {
  allVideos: [],
  foldersWithVideo: [],
  query: '',
  foldersOnly: false,
  rootDir: '',
  scannedAt: '',
  ffprobeAvailable: false,
  activeInline: null
};

const dom = {
  statusText: document.getElementById('statusText'),
  searchInput: document.getElementById('searchInput'),
  foldersOnly: document.getElementById('foldersOnly'),
  grid: document.getElementById('grid'),
  cardTpl: document.getElementById('videoCardTemplate'),
  rescanBtn: document.getElementById('rescanBtn')
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
    // En móvil puede requerirse interacción extra.
  });

  state.activeInline = {
    videoId: video.id,
    ...refs
  };
}

function makeCard(video, extraLabel = '') {
  const node = dom.cardTpl.content.firstElementChild.cloneNode(true);
  const title = node.querySelector('.title');
  const meta = node.querySelector('.meta');
  const thumb = node.querySelector('.thumb');
  const placeholder = node.querySelector('.placeholder');
  const player = node.querySelector('.inline-player');
  const playBtn = node.querySelector('.play-btn');

  title.textContent = video.fileName;

  const folder = video.workshopFolder || 'root';
  const duration = formatDuration(video.durationSeconds);
  meta.textContent = extraLabel || `Carpeta: ${folder} | Duración: ${duration}`;

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

function getFilteredVideos() {
  const q = state.query.trim().toLowerCase();

  if (state.foldersOnly) {
    const byFolder = new Map();

    for (const video of state.allVideos) {
      if (!byFolder.has(video.workshopFolder)) {
        byFolder.set(video.workshopFolder, { video, count: 0 });
      }
      byFolder.get(video.workshopFolder).count += 1;
    }

    return Array.from(byFolder.values())
      .filter(({ video }) => {
        if (!q) return true;
        return (
          video.fileName.toLowerCase().includes(q) ||
          String(video.workshopFolder).toLowerCase().includes(q) ||
          String(video.folderRelative).toLowerCase().includes(q)
        );
      })
      .map(({ video, count }) => ({
        video,
        label: `Carpeta: ${video.workshopFolder} | ${count} video(s)`
      }));
  }

  return state.allVideos
    .filter((video) => {
      if (!q) return true;
      return (
        video.fileName.toLowerCase().includes(q) ||
        String(video.workshopFolder).toLowerCase().includes(q) ||
        String(video.folderRelative).toLowerCase().includes(q)
      );
    })
    .map((video) => ({ video, label: '' }));
}

function render() {
  if (state.activeInline) {
    stopInlinePlayback(state.activeInline);
    state.activeInline = null;
  }

  const items = getFilteredVideos();
  dom.grid.innerHTML = '';

  if (items.length === 0) {
    dom.grid.innerHTML = '<p>No hay resultados para ese filtro.</p>';
    return;
  }

  const fragment = document.createDocumentFragment();
  for (const item of items) {
    fragment.appendChild(makeCard(item.video, item.label));
  }
  dom.grid.appendChild(fragment);
}

function updateStatus() {
  const mode = state.foldersOnly ? 'modo carpetas' : 'modo videos';
  dom.statusText.textContent = `${state.allVideos.length} video(s) | Escaneado: ${formatDate(state.scannedAt)} | ${mode}${state.ffprobeAvailable ? '' : ' | sin ffprobe (duración parcial)'}`;
}

async function loadLibrary() {
  const response = await fetch('/api/videos');

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error || 'No se pudo leer la biblioteca.');
  }

  const data = await response.json();
  state.allVideos = data.videos || [];
  state.foldersWithVideo = data.foldersWithVideo || [];
  state.rootDir = data.rootDir || '';
  state.scannedAt = data.scannedAt || '';
  state.ffprobeAvailable = Boolean(data.ffprobeAvailable);

  updateStatus();
  render();
}

async function rescan() {
  dom.statusText.textContent = 'Reescaneando...';
  const response = await fetch('/api/rescan', { method: 'POST' });

  if (!response.ok) {
    throw new Error('Error al reescanear.');
  }

  await loadLibrary();
}

dom.searchInput.addEventListener('input', (event) => {
  state.query = event.target.value;
  render();
});

dom.foldersOnly.addEventListener('change', (event) => {
  state.foldersOnly = Boolean(event.target.checked);
  updateStatus();
  render();
});

dom.rescanBtn.addEventListener('click', () => {
  rescan().catch((error) => {
    dom.statusText.textContent = error.message;
  });
});

loadLibrary().catch((error) => {
  dom.statusText.textContent = error.message;
});
