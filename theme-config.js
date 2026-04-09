(function(){
  const STORAGE_KEY = 'mis_finanzas_global_theme_v2';

  const defaultTheme = {
    preset: 'aurora',
    mode: 'light',
    background: 'aurora',
    lines: 'violet',
    lineMotion: 'soft_pulse',
    effects: 'violet_glow',
    buttons: 'aurora',
    general: 'violet'
  };

  const catalog = {
    preset: [
      { key: 'glacier', label: 'Glacier', description: 'Frio, limpio y luminoso.', swatches: ['#d8f4ff', '#62c8ff', '#2c78ff'] },
      { key: 'ocean', label: 'Ocean', description: 'Azul intenso y prolijo.', swatches: ['#dfe8ff', '#4f79ff', '#2348d8'] },
      { key: 'aurora', label: 'Aurora', description: 'Violeta brillante con suavidad.', swatches: ['#efe6ff', '#885dff', '#ff59c7'] },
      { key: 'mint', label: 'Mint', description: 'Verde fresco con energia.', swatches: ['#e5fff6', '#1ed5a3', '#00bdb8'] },
      { key: 'orchid', label: 'Orchid', description: 'Lila mas fuerte y elegante.', swatches: ['#f1e3ff', '#a45cff', '#ff6fd8'] },
      { key: 'peach', label: 'Peach', description: 'Durazno calido y moderno.', swatches: ['#fff0e3', '#ffae58', '#ff7a74'] },
      { key: 'sunset', label: 'Sunset', description: 'Coral y ambar con impacto.', swatches: ['#fff0e4', '#ff7d4f', '#ffb02e'] },
      { key: 'ember', label: 'Ember', description: 'Calido fuerte pero fino.', swatches: ['#fff1ec', '#ff6d57', '#ff3f8f'] },
      { key: 'neon_light', label: 'Neon claro', description: 'Luminoso y vibrante.', swatches: ['#f2f7ff', '#2ee6ff', '#8758ff'] },
      { key: 'neon_dark', label: 'Neon oscuro', description: 'Nocturno, profundo y brillante.', swatches: ['#0b0f1d', '#19dfff', '#8a5cff'] },
      { key: 'custom', label: 'Personalizado', description: 'Combinacion armada a mano.', swatches: ['#d9d9d9', '#919191', '#4f4f4f'] }
    ],
    mode: [
      { key: 'light', label: 'Claro', description: 'Mas limpio y aireado.', swatches: ['#faf8ff', '#ffffff', '#6c8cff'] },
      { key: 'dark', label: 'Oscuro', description: 'Mas profundo y elegante.', swatches: ['#050913', '#11192b', '#8e9fff'] }
    ],
    background: [
      { key: 'glacier', label: 'Glacier', description: 'Helado con azul suave.', swatches: ['#f4fcff', '#d8f4ff', '#dbe3ff'] },
      { key: 'ocean', label: 'Ocean', description: 'Celeste intenso y frio.', swatches: ['#edf3ff', '#d7e4ff', '#ced9ff'] },
      { key: 'aurora', label: 'Aurora', description: 'Lavanda con rosa frio.', swatches: ['#f0e7ff', '#e8ebff', '#ffe7f6'] },
      { key: 'mint', label: 'Mint', description: 'Menta brillante.', swatches: ['#effff9', '#e0fff2', '#ddfff8'] },
      { key: 'orchid', label: 'Orchid', description: 'Lila vivo y delicado.', swatches: ['#f8ebff', '#f0e0ff', '#ffe8f7'] },
      { key: 'peach', label: 'Peach', description: 'Durazno suave.', swatches: ['#fff5ec', '#ffe7d8', '#fff0eb'] },
      { key: 'sunset', label: 'Sunset', description: 'Rosado calido.', swatches: ['#fff1e4', '#ffe0d5', '#ffe8dc'] },
      { key: 'ember', label: 'Ember', description: 'Base calida con coral.', swatches: ['#fff3ee', '#ffe2d8', '#ffe7ee'] },
      { key: 'neon_light', label: 'Neon claro', description: 'Claro con energia neon.', swatches: ['#f3f7ff', '#e5fbff', '#f1ebff'] },
      { key: 'night', label: 'Night', description: 'Oscuro elegante.', swatches: ['#0c0f19', '#131826', '#1d2340'] },
      { key: 'neon_dark', label: 'Neon oscuro', description: 'Oscuro con toques electricos.', swatches: ['#090d18', '#11182c', '#191d3b'] }
    ],
    lines: [
      { key: 'ice', label: 'Hielo', description: 'Celeste claro mas fuerte.', swatches: ['#9ddcff'] },
      { key: 'cyan', label: 'Cyan', description: 'Frio brillante.', swatches: ['#4fc4ff'] },
      { key: 'violet', label: 'Violeta', description: 'Morado firme y prolijo.', swatches: ['#9a72ff'] },
      { key: 'orchid', label: 'Orchid', description: 'Lila vibrante.', swatches: ['#c067ff'] },
      { key: 'mint', label: 'Menta', description: 'Verde fresco.', swatches: ['#53d7ad'] },
      { key: 'rose', label: 'Rosa', description: 'Rosado definido.', swatches: ['#ff8eb9'] },
      { key: 'coral', label: 'Coral', description: 'Calido con caracter.', swatches: ['#ff8a6b'] },
      { key: 'amber', label: 'Ambar', description: 'Dorado mas intenso.', swatches: ['#ffc066'] },
      { key: 'graphite', label: 'Grafito', description: 'Oscuro sobrio.', swatches: ['#303449'] },
      { key: 'pearl', label: 'Perla', description: 'Claro limpio.', swatches: ['#ffffff'] }
    ],
    lineMotion: [
      { key: 'none', label: 'Sin animacion', description: 'Lineas estaticas.', swatches: ['#d0d0d0'] },
      { key: 'soft_pulse', label: 'Pulso suave', description: 'Respira apenas.', swatches: ['#8f6bff', '#c9b6ff'] },
      { key: 'glow_wave', label: 'Glow wave', description: 'Ondita luminosa continua.', swatches: ['#2ee6ff', '#8f6bff'] },
      { key: 'neon_bloom', label: 'Neon bloom', description: 'Brillo mas notorio.', swatches: ['#00ffd5', '#ff5fd2'] },
      { key: 'electric', label: 'Electrico', description: 'Mas vivo y marcado.', swatches: ['#19dfff', '#8758ff'] },
      { key: 'rgb_cycle', label: 'RGB cycle', description: 'Alterna colores como un aro RGB.', swatches: ['#1ee3ff', '#7f5cff', '#ff62c1'] },
      { key: 'argb_fan', label: 'ARGB fan', description: 'Barrido multicolor tipo cooler gamer.', swatches: ['#19dfff', '#8cff66', '#ffb347', '#ff5f9a'] },
      { key: 'rainbow_breath', label: 'Rainbow breath', description: 'Respira entre tonos frios y calidos.', swatches: ['#49c6ff', '#7d67ff', '#ff6ed6', '#ffb45f'] }
    ],
    effects: [
      { key: 'ice_glow', label: 'Glow hielo', description: 'Brillo celeste nitido.', swatches: ['#6fdcff', '#c4f7ff'] },
      { key: 'aqua_glow', label: 'Glow aqua', description: 'Turquesa luminoso.', swatches: ['#00ffd5', '#7afff4'] },
      { key: 'violet_glow', label: 'Glow violeta', description: 'Lila fuerte.', swatches: ['#8f6bff', '#c5b4ff'] },
      { key: 'magenta_glow', label: 'Glow magenta', description: 'Rosado mas vivo.', swatches: ['#ff4fd8', '#ffacef'] },
      { key: 'mint_glow', label: 'Glow menta', description: 'Verde luminoso.', swatches: ['#20d99f', '#95f5d4'] },
      { key: 'coral_glow', label: 'Glow coral', description: 'Calidez con energia.', swatches: ['#ff7b63', '#ffc2b3'] },
      { key: 'amber_glow', label: 'Glow ambar', description: 'Dorado pronunciado.', swatches: ['#ffb347', '#ffe0a3'] },
      { key: 'ember_glow', label: 'Glow ember', description: 'Rojo-rosa potente.', swatches: ['#ff5876', '#ffb1bc'] },
      { key: 'neon_blue_glow', label: 'Glow neon azul', description: 'Electrico y frio.', swatches: ['#19dfff', '#86f6ff'] },
      { key: 'argb_ring_glow', label: 'Glow ARGB', description: 'Halo gamer multicolor.', swatches: ['#19dfff', '#8cff66', '#ffb347', '#ff5f9a'] },
      { key: 'plasma_glow', label: 'Glow plasma', description: 'Azul-violeta intenso.', swatches: ['#4cc7ff', '#8f6bff', '#ff62c1'] },
      { key: 'frostfire_glow', label: 'Glow frostfire', description: 'Frio y calido bien contrastado.', swatches: ['#27e7ff', '#8d67ff', '#ffb14d'] }
    ],
    buttons: [
      { key: 'glacier', label: 'Glacier', description: 'Celeste + azul.', swatches: ['#58d5ff', '#357dff'] },
      { key: 'ocean', label: 'Ocean', description: 'Azul profundo.', swatches: ['#4f79ff', '#233fd8'] },
      { key: 'aurora', label: 'Aurora', description: 'Turquesa + violeta.', swatches: ['#00ffd5', '#885dff'] },
      { key: 'orchid', label: 'Orchid', description: 'Violeta + rosa fuerte.', swatches: ['#9b5cff', '#ff67d0'] },
      { key: 'mint', label: 'Mint', description: 'Verde + aqua.', swatches: ['#00e59c', '#00c7ff'] },
      { key: 'peach', label: 'Peach', description: 'Durazno definido.', swatches: ['#ffb158', '#ff7f66'] },
      { key: 'sunset', label: 'Sunset', description: 'Coral + ambar.', swatches: ['#ff7d4f', '#ffb02e'] },
      { key: 'ember', label: 'Ember', description: 'Coral + rosa intenso.', swatches: ['#ff6d57', '#ff3f8f'] },
      { key: 'neon_light', label: 'Neon claro', description: 'Glow brillante y claro.', swatches: ['#2ee6ff', '#8758ff'] },
      { key: 'neon_dark', label: 'Neon oscuro', description: 'Neon para modo nocturno.', swatches: ['#19dfff', '#a050ff'] },
      { key: 'mono', label: 'Monocromo', description: 'Oscuro sobrio.', swatches: ['#677083', '#111827'] }
    ],
    general: [
      { key: 'cyan', label: 'Cyan', description: 'Acento frio brillante.', swatches: ['#3fb9ff'] },
      { key: 'indigo', label: 'Indigo', description: 'Azul fuerte.', swatches: ['#5475ff'] },
      { key: 'violet', label: 'Violeta', description: 'Lila protagonista.', swatches: ['#8f6bff'] },
      { key: 'orchid', label: 'Orchid', description: 'Morado rosado.', swatches: ['#b55fff'] },
      { key: 'emerald', label: 'Esmeralda', description: 'Verde con punch.', swatches: ['#13c98a'] },
      { key: 'mint', label: 'Menta', description: 'Verde agua fresco.', swatches: ['#00c9b8'] },
      { key: 'rose', label: 'Rosa', description: 'Rosado intenso.', swatches: ['#ff5f9a'] },
      { key: 'coral', label: 'Coral', description: 'Calido vivo.', swatches: ['#ff7b63'] },
      { key: 'amber', label: 'Ambar', description: 'Dorado vibrante.', swatches: ['#ffb347'] },
      { key: 'graphite', label: 'Grafito', description: 'Neutral oscuro.', swatches: ['#475569'] }
    ]
  };

  const presetProfiles = {
    glacier: { mode: 'light', background: 'glacier', lines: 'ice', lineMotion: 'soft_pulse', effects: 'ice_glow', buttons: 'glacier', general: 'cyan' },
    ocean: { mode: 'light', background: 'ocean', lines: 'cyan', lineMotion: 'glow_wave', effects: 'aqua_glow', buttons: 'ocean', general: 'indigo' },
    aurora: { mode: 'light', background: 'aurora', lines: 'violet', lineMotion: 'soft_pulse', effects: 'violet_glow', buttons: 'aurora', general: 'violet' },
    mint: { mode: 'light', background: 'mint', lines: 'mint', lineMotion: 'soft_pulse', effects: 'mint_glow', buttons: 'mint', general: 'emerald' },
    orchid: { mode: 'light', background: 'orchid', lines: 'orchid', lineMotion: 'glow_wave', effects: 'magenta_glow', buttons: 'orchid', general: 'orchid' },
    peach: { mode: 'light', background: 'peach', lines: 'amber', lineMotion: 'soft_pulse', effects: 'amber_glow', buttons: 'peach', general: 'amber' },
    sunset: { mode: 'light', background: 'sunset', lines: 'coral', lineMotion: 'glow_wave', effects: 'coral_glow', buttons: 'sunset', general: 'coral' },
    ember: { mode: 'light', background: 'ember', lines: 'rose', lineMotion: 'neon_bloom', effects: 'ember_glow', buttons: 'ember', general: 'rose' },
    neon_light: { mode: 'light', background: 'neon_light', lines: 'cyan', lineMotion: 'rgb_cycle', effects: 'plasma_glow', buttons: 'neon_light', general: 'violet' },
    neon_dark: { mode: 'dark', background: 'neon_dark', lines: 'violet', lineMotion: 'argb_fan', effects: 'argb_ring_glow', buttons: 'neon_dark', general: 'orchid' },
    custom: { ...defaultTheme, preset: 'custom' }
  };

  const modeProfiles = {
    light: {
      bg: '#f7f4ff',
      bg2: '#f6f1ff',
      card: '#ffffff',
      card2: '#f8f3ff',
      cardSoft: 'rgba(255,255,255,.76)',
      chrome: 'rgba(255,255,255,.64)',
      chromeStrong: 'rgba(255,255,255,.78)',
      surfaceAlt: 'rgba(246,242,255,.74)',
      text: '#232537',
      muted: '#71749a',
      inputBg: 'rgba(245,239,255,.62)',
      overlay: 'rgba(180,170,255,.24)',
      success: '#00c97a',
      red: '#ff5470',
      yellow: '#ffb347'
    },
    dark: {
      bg: '#050913',
      bg2: '#0c1322',
      card: 'rgba(12,18,32,.92)',
      card2: 'rgba(16,24,42,.96)',
      cardSoft: 'rgba(255,255,255,.035)',
      chrome: 'rgba(7,11,20,.78)',
      chromeStrong: 'rgba(10,15,26,.92)',
      surfaceAlt: 'rgba(18,26,44,.88)',
      text: '#eef2ff',
      muted: '#8f9dc2',
      inputBg: 'rgba(255,255,255,.055)',
      overlay: 'rgba(3,6,13,.76)',
      success: '#25e0a0',
      red: '#ff708a',
      yellow: '#ffc85d'
    }
  };

  const backgroundProfiles = {
    glacier: 'linear-gradient(135deg, #f4fcff 0%, #d8f4ff 42%, #dae4ff 100%)',
    ocean: 'linear-gradient(135deg, #eef3ff 0%, #d7e4ff 45%, #c9d7ff 100%)',
    aurora: 'linear-gradient(135deg, #f0e7ff 0%, #e7ebff 42%, #ffe7f6 100%)',
    mint: 'linear-gradient(135deg, #effff9 0%, #e0fff2 42%, #dcfff9 100%)',
    orchid: 'linear-gradient(135deg, #f7ebff 0%, #efdcff 44%, #ffe6f6 100%)',
    peach: 'linear-gradient(135deg, #fff6ee 0%, #ffe7d8 44%, #fff0eb 100%)',
    sunset: 'linear-gradient(135deg, #fff3e7 0%, #ffe0d5 46%, #ffe7d9 100%)',
    ember: 'linear-gradient(135deg, #fff2ee 0%, #ffe0d8 46%, #ffe5ef 100%)',
    neon_light: 'linear-gradient(135deg, #f4f9ff 0%, #e3fbff 36%, #efe9ff 100%)',
    night: 'radial-gradient(circle at 18% 18%, rgba(70,102,255,.22), transparent 28%), radial-gradient(circle at 82% 14%, rgba(255,82,187,.18), transparent 26%), linear-gradient(180deg, #090d16 0%, #111727 56%, #0b111e 100%)',
    neon_dark: 'radial-gradient(circle at 18% 18%, rgba(25,223,255,.18), transparent 28%), radial-gradient(circle at 82% 14%, rgba(138,92,255,.16), transparent 26%), linear-gradient(180deg, #070b14 0%, #0e1424 52%, #0a1020 100%)'
  };

  const lineProfiles = {
    ice: '#9ddcff',
    cyan: '#4fc4ff',
    violet: '#9a72ff',
    orchid: '#c067ff',
    mint: '#53d7ad',
    rose: '#ff8eb9',
    coral: '#ff8a6b',
    amber: '#ffc066',
    graphite: '#303449',
    pearl: '#ffffff'
  };

  const lineMotionProfiles = {
    none: { animation: 'none', duration: '0s', glowSoft: 0.12, glowStrong: 0.18, opacity: 0.16 },
    soft_pulse: { animation: 'mfLinePulse', duration: '3.8s', glowSoft: 0.18, glowStrong: 0.30, opacity: 0.22 },
    glow_wave: { animation: 'mfLineWave', duration: '4.8s', glowSoft: 0.20, glowStrong: 0.34, opacity: 0.24 },
    neon_bloom: { animation: 'mfLineBloom', duration: '2.8s', glowSoft: 0.24, glowStrong: 0.42, opacity: 0.28 },
    electric: { animation: 'mfLineElectric', duration: '2.2s', glowSoft: 0.26, glowStrong: 0.48, opacity: 0.30 },
    rgb_cycle: { animation: 'mfLineRgbCycle', duration: '4.6s', glowSoft: 0.22, glowStrong: 0.44, opacity: 0.26 },
    argb_fan: { animation: 'mfLineArgbFan', duration: '3.2s', glowSoft: 0.24, glowStrong: 0.50, opacity: 0.28 },
    rainbow_breath: { animation: 'mfLineRainbowBreath', duration: '5.4s', glowSoft: 0.20, glowStrong: 0.40, opacity: 0.24 }
  };

  const effectProfiles = {
    ice_glow: '#6fdcff',
    aqua_glow: '#00ffd5',
    violet_glow: '#8f6bff',
    magenta_glow: '#ff4fd8',
    mint_glow: '#20d99f',
    coral_glow: '#ff7b63',
    amber_glow: '#ffb347',
    ember_glow: '#ff5876',
    neon_blue_glow: '#19dfff',
    argb_ring_glow: '#8cff66',
    plasma_glow: '#5cbcff',
    frostfire_glow: '#ffb14d'
  };

  const buttonProfiles = {
    glacier: { from: '#58d5ff', to: '#357dff' },
    ocean: { from: '#4f79ff', to: '#233fd8' },
    aurora: { from: '#00ffd5', to: '#885dff' },
    orchid: { from: '#9b5cff', to: '#ff67d0' },
    mint: { from: '#00e59c', to: '#00c7ff' },
    peach: { from: '#ffb158', to: '#ff7f66' },
    sunset: { from: '#ff7d4f', to: '#ffb02e' },
    ember: { from: '#ff6d57', to: '#ff3f8f' },
    neon_light: { from: '#2ee6ff', to: '#8758ff' },
    neon_dark: { from: '#19dfff', to: '#a050ff' },
    mono: { from: '#677083', to: '#111827' }
  };

  const generalProfiles = {
    cyan: '#3fb9ff',
    indigo: '#5475ff',
    violet: '#8f6bff',
    orchid: '#b55fff',
    emerald: '#13c98a',
    mint: '#00c9b8',
    rose: '#ff5f9a',
    coral: '#ff7b63',
    amber: '#ffb347',
    graphite: '#475569'
  };

  let currentTheme = null;

  function clampTheme(theme){
    const incoming = theme || {};
    const hasPreset = Object.prototype.hasOwnProperty.call(incoming, 'preset');
    const next = { ...defaultTheme, ...incoming };

    Object.keys(defaultTheme).forEach(key => {
      const valid = (catalog[key] || []).some(item => item.key === next[key]);
      if(!valid){
        next[key] = key === 'preset' && !hasPreset ? 'custom' : defaultTheme[key];
      }
    });

    return next;
  }

  function hexToRgba(hex, alpha){
    const value = String(hex || '').replace('#', '');
    if(value.length !== 6) return 'rgba(124,140,255,' + alpha + ')';
    const int = parseInt(value, 16);
    const r = (int >> 16) & 255;
    const g = (int >> 8) & 255;
    const b = int & 255;
    return 'rgba(' + r + ',' + g + ',' + b + ',' + alpha + ')';
  }

  function readTheme(){
    try{
      const raw = localStorage.getItem(STORAGE_KEY);
      if(!raw) return clampTheme(defaultTheme);
      return clampTheme(JSON.parse(raw));
    }catch{
      localStorage.removeItem(STORAGE_KEY);
      return clampTheme(defaultTheme);
    }
  }

  function writeTheme(theme){
    localStorage.setItem(STORAGE_KEY, JSON.stringify(clampTheme(theme)));
  }

  function ensureRuntimeStyle(){
    let style = document.getElementById('mf-theme-runtime');
    if(style) return style;
    style = document.createElement('style');
    style.id = 'mf-theme-runtime';
    style.textContent = `
      @keyframes mfLinePulse {
        0%,100% { box-shadow: 0 0 0 1px var(--border), 0 0 14px var(--line-glow-soft), 0 12px 34px var(--surface-shadow); }
        50% { box-shadow: 0 0 0 1px var(--border), 0 0 24px var(--line-glow-strong), 0 14px 40px var(--surface-shadow); }
      }
      @keyframes mfLineWave {
        0%,100% { box-shadow: 0 0 0 1px var(--border), -8px 0 18px var(--line-glow-soft), 0 12px 34px var(--surface-shadow); }
        50% { box-shadow: 0 0 0 1px var(--border), 8px 0 28px var(--line-glow-strong), 0 14px 40px var(--surface-shadow); }
      }
      @keyframes mfLineBloom {
        0%,100% { box-shadow: 0 0 0 1px var(--border), 0 0 16px var(--line-glow-soft), 0 12px 34px var(--surface-shadow); }
        35% { box-shadow: 0 0 0 1px var(--border), 0 0 34px var(--line-glow-strong), 0 16px 42px var(--surface-shadow); }
        70% { box-shadow: 0 0 0 1px var(--border), 0 0 22px var(--line-glow-strong), 0 12px 34px var(--surface-shadow); }
      }
      @keyframes mfLineElectric {
        0%,100% { box-shadow: 0 0 0 1px var(--border), 0 0 18px var(--line-glow-soft), 0 12px 34px var(--surface-shadow); }
        25% { box-shadow: 0 0 0 1px var(--border), 0 0 34px var(--line-glow-strong), 0 14px 40px var(--surface-shadow); }
        50% { box-shadow: 0 0 0 1px var(--border), 0 0 22px var(--line-glow-soft), 0 12px 34px var(--surface-shadow); }
        75% { box-shadow: 0 0 0 1px var(--border), 0 0 38px var(--line-glow-strong), 0 16px 42px var(--surface-shadow); }
      }
      @keyframes mfLineRgbCycle {
        0%,100% { box-shadow: 0 0 0 1px var(--border), 0 0 14px var(--line-glow-soft), 0 0 28px var(--line-glow-accent-a), 0 12px 34px var(--surface-shadow); }
        33% { box-shadow: 0 0 0 1px var(--border), 0 0 18px var(--line-glow-soft), 0 0 34px var(--line-glow-accent-b), 0 14px 40px var(--surface-shadow); }
        66% { box-shadow: 0 0 0 1px var(--border), 0 0 18px var(--line-glow-soft), 0 0 34px var(--line-glow-accent-c), 0 14px 40px var(--surface-shadow); }
      }
      @keyframes mfLineArgbFan {
        0% { box-shadow: 0 0 0 1px var(--border), -8px -2px 18px var(--line-glow-accent-a), 8px 2px 18px var(--line-glow-accent-b), 0 12px 34px var(--surface-shadow); }
        25% { box-shadow: 0 0 0 1px var(--border), -2px -8px 20px var(--line-glow-accent-b), 10px 6px 22px var(--line-glow-accent-c), 0 14px 40px var(--surface-shadow); }
        50% { box-shadow: 0 0 0 1px var(--border), 6px -6px 22px var(--line-glow-accent-c), -6px 8px 20px var(--line-glow-accent-a), 0 14px 42px var(--surface-shadow); }
        75% { box-shadow: 0 0 0 1px var(--border), 10px 2px 22px var(--line-glow-accent-a), -8px -4px 18px var(--line-glow-accent-b), 0 16px 44px var(--surface-shadow); }
        100% { box-shadow: 0 0 0 1px var(--border), -8px -2px 18px var(--line-glow-accent-a), 8px 2px 18px var(--line-glow-accent-b), 0 12px 34px var(--surface-shadow); }
      }
      @keyframes mfLineRainbowBreath {
        0%,100% { box-shadow: 0 0 0 1px var(--border), 0 0 14px var(--line-glow-accent-a), 0 0 28px var(--line-glow-accent-c), 0 12px 34px var(--surface-shadow); }
        50% { box-shadow: 0 0 0 1px var(--border), 0 0 20px var(--line-glow-accent-b), 0 0 34px var(--line-glow-accent-a), 0 14px 40px var(--surface-shadow); }
      }
      body{
        background: var(--body-bg) !important;
        color: var(--text) !important;
      }
      header,
      .usd-bar,
      .tabs{
        background: var(--chrome-bg) !important;
        border-color: var(--line-tint) !important;
      }
      .login-btn,
      .cfg-btn-ok,
      .btn-submit,
      .modal-btn-ok,
      .cfg-weekly-info-close,
      .btn-primary{
        background: var(--button-gradient) !important;
        box-shadow: 0 12px 30px var(--button-shadow) !important;
      }
      .fijo-pago-form button,
      .pago-form button{
        background: linear-gradient(135deg, var(--button-from), var(--button-to)) !important;
      }
      .toast:not(.error){
        background: var(--button-gradient) !important;
        box-shadow: 0 12px 30px var(--button-shadow) !important;
      }
      .tab.active,
      .tab-btn.active,
      .cfg-tab-chip.active,
      .cfg-theme-choice.active{
        border-color: var(--blue) !important;
      }
      .cfg-theme-row,
      .cfg-theme-choice{
        animation: none !important;
        border-color: rgba(108,140,255,.16) !important;
        box-shadow: inset 0 1px 0 rgba(255,255,255,.26), 0 10px 22px rgba(108,140,255,.08) !important;
      }
      .cfg-theme-choice.active,
      .cfg-tab-chip.active{
        box-shadow: inset 0 1px 0 rgba(255,255,255,.24), 0 12px 26px rgba(108,140,255,.12) !important;
      }
      .field input:focus,
      .search-input:focus,
      .login-group input:focus,
      .cfg-theme-choice:hover{
        border-color: var(--blue) !important;
        box-shadow: 0 0 0 3px var(--focus-ring) !important;
      }
      .login-box,
      .card,
      .item,
      .sum-card,
      .fijo-panel,
      .tarjetas-panel,
      .sem-group,
      .cfg-box,
      .cfg-option,
      .cfg-theme-row,
      .cfg-theme-choice,
      .drop-zone,
      .audit-row,
      .pill,
      .status,
      .grid-item,
      .date-picker-display,
      .login-group input,
      .field input,
      .search-input{
        border-color: var(--border) !important;
        animation: var(--line-animation-name) var(--line-animation-duration) ease-in-out infinite;
        box-shadow: 0 0 0 1px var(--border), 0 0 14px var(--line-glow-soft), 0 12px 34px var(--surface-shadow);
      }
      [data-mf-mode="dark"] .login-box,
      [data-mf-mode="dark"] .sum-card,
      [data-mf-mode="dark"] .fijo-panel,
      [data-mf-mode="dark"] .tarjetas-panel,
      [data-mf-mode="dark"] .sem-group,
      [data-mf-mode="dark"] .form-card,
      [data-mf-mode="dark"] .tarjetas-manager,
      [data-mf-mode="dark"] .mes-card,
      [data-mf-mode="dark"] .cfg-box,
      [data-mf-mode="dark"] .cfg-theme-picker-card,
      [data-mf-mode="dark"] .notif-panel-inner,
      [data-mf-mode="dark"] .mov-panel,
      [data-mf-mode="dark"] .modal-box,
      [data-mf-mode="dark"] .drop-zone,
      [data-mf-mode="dark"] .dp-popup,
      [data-mf-mode="dark"] .super-table-wrap,
      [data-mf-mode="dark"] .super-total-inner,
      [data-mf-mode="dark"] .inf-sem-card,
      [data-mf-mode="dark"] .audit-row{
        background: var(--card) !important;
        color: var(--text) !important;
        box-shadow: 0 0 0 1px var(--border), 0 0 18px var(--line-glow-soft), 0 18px 48px rgba(0,0,0,.42) !important;
      }
      [data-mf-mode="dark"] header,
      [data-mf-mode="dark"] .usd-bar,
      [data-mf-mode="dark"] .tabs{
        box-shadow: inset 0 -1px 0 rgba(255,255,255,.03), 0 10px 28px rgba(0,0,0,.22);
      }
      [data-mf-mode="dark"] .sem-header,
      [data-mf-mode="dark"] .sem-body,
      [data-mf-mode="dark"] .det-sem-header,
      [data-mf-mode="dark"] .det-tarjetas-section,
      [data-mf-mode="dark"] .tarjeta-tab,
      [data-mf-mode="dark"] .usd-pill,
      [data-mf-mode="dark"] .periodo-btn,
      [data-mf-mode="dark"] .tipo-btn,
      [data-mf-mode="dark"] .subtipo-btn,
      [data-mf-mode="dark"] .subtipo-fijo-btn,
      [data-mf-mode="dark"] .moneda-btn,
      [data-mf-mode="dark"] .tarjeta-chip,
      [data-mf-mode="dark"] .user-badge,
      [data-mf-mode="dark"] .logout-btn,
      [data-mf-mode="dark"] .config-btn,
      [data-mf-mode="dark"] .cfg-option,
      [data-mf-mode="dark"] .cfg-tab-chip,
      [data-mf-mode="dark"] .share-cuotas-tab,
      [data-mf-mode="dark"] .status,
      [data-mf-mode="dark"] .pill{
        background: var(--surface-alt) !important;
        color: var(--text) !important;
      }
      [data-mf-mode="dark"] .cfg-theme-row,
      [data-mf-mode="dark"] .cfg-theme-choice{
        background: linear-gradient(135deg, rgba(27,34,56,.88), rgba(18,24,42,.92)) !important;
        border-color: rgba(138,156,255,.16) !important;
        box-shadow: inset 0 1px 0 rgba(255,255,255,.04), 0 14px 28px rgba(0,0,0,.22) !important;
      }
      [data-mf-mode="dark"] .cfg-theme-choice.active,
      [data-mf-mode="dark"] .cfg-tab-chip.active{
        background: linear-gradient(135deg, rgba(79,196,255,.12), rgba(143,107,255,.14)) !important;
        border-color: rgba(143,107,255,.44) !important;
      }
      [data-mf-mode="dark"] .cfg-theme-action{
        background: linear-gradient(135deg, rgba(45,217,232,.96), rgba(125,117,255,.96)) !important;
        box-shadow: 0 12px 24px rgba(46,83,255,.18) !important;
      }
      [data-mf-mode="dark"] .mov-item:hover,
      [data-mf-mode="dark"] .sem-header:hover,
      [data-mf-mode="dark"] .cfg-option:hover{
        background: var(--card2) !important;
      }
      [data-mf-mode="dark"] .super-table thead tr,
      [data-mf-mode="dark"] .super-table-footer{
        background: linear-gradient(135deg, rgba(20,29,50,.98), rgba(12,20,37,.98)) !important;
      }
      [data-mf-mode="dark"] .super-table tbody tr:hover{
        background: rgba(255,255,255,.03) !important;
      }
      [data-mf-mode="dark"] .super-table tbody tr{
        border-color: rgba(255,255,255,.07) !important;
      }
      [data-mf-mode="dark"] .super-inp,
      [data-mf-mode="dark"] input,
      [data-mf-mode="dark"] select,
      [data-mf-mode="dark"] .login-group input,
      [data-mf-mode="dark"] .field input,
      [data-mf-mode="dark"] .search-input,
      [data-mf-mode="dark"] .pago-form input,
      [data-mf-mode="dark"] .fijo-pago-form input,
      [data-mf-mode="dark"] .usd-custom-wrap input{
        background: var(--input-bg) !important;
        color: var(--text) !important;
      }
      [data-mf-mode="dark"] .super-inp:focus{
        background: rgba(255,255,255,.08) !important;
      }
      [data-mf-mode="dark"] .date-picker-display{
        background: linear-gradient(135deg, rgba(19,27,45,.94), rgba(13,20,37,.96)) !important;
        border-color: var(--line-tint) !important;
        box-shadow: inset 0 1px 0 rgba(255,255,255,.03), 0 0 0 1px rgba(255,255,255,.02), 0 10px 24px rgba(0,0,0,.22) !important;
      }
      [data-mf-mode="dark"] .date-picker-display:hover,
      [data-mf-mode="dark"] .date-picker-display.open{
        border-color: var(--border) !important;
        box-shadow: inset 0 1px 0 rgba(255,255,255,.04), 0 0 0 1px var(--border), 0 0 0 3px rgba(255,255,255,.04), 0 12px 28px rgba(0,0,0,.28) !important;
      }
      [data-mf-mode="dark"] .date-picker-display input,
      [data-mf-mode="dark"] .date-picker-display .dp-icon{
        color: var(--text) !important;
      }
      [data-mf-mode="dark"] .date-picker-display input::placeholder{
        color: rgba(187,197,229,.44) !important;
      }
      [data-mf-mode="dark"] .date-picker-display .dp-icon{
        opacity: .8;
        background: rgba(255,255,255,.05);
        border-left: 1px solid rgba(255,255,255,.06);
      }
      [data-mf-mode="dark"] select option{
        background: #0f1628;
        color: var(--text);
      }
      [data-mf-mode="dark"] .toggle-slider{
        background: rgba(255,255,255,.12) !important;
        box-shadow: inset 0 1px 3px rgba(0,0,0,.38);
      }
      [data-mf-mode="dark"] .toggle-slider:before,
      [data-mf-mode="dark"] .confirm-toggle::after{
        background: #f4f7ff !important;
      }
      [data-mf-mode="dark"] .confirm-toggle{
        background: linear-gradient(90deg, rgba(104,116,152,.55), rgba(66,76,112,.62)) !important;
        box-shadow: inset 0 1px 3px rgba(0,0,0,.44) !important;
      }
      [data-mf-mode="dark"] .confirm-toggle.checked{
        background: linear-gradient(90deg, var(--button-from), var(--button-to)) !important;
        box-shadow: 0 0 12px var(--line-glow-soft) !important;
      }
      [data-mf-mode="dark"] .mes-nav button,
      [data-mf-mode="dark"] .super-nueva-btn,
      [data-mf-mode="dark"] .super-borrar-btn,
      [data-mf-mode="dark"] .super-add-btn{
        background: var(--surface-alt) !important;
        color: var(--text) !important;
      }
      [data-mf-mode="dark"] .super-add-btn{
        border-color: rgba(138,156,255,.34) !important;
        color: var(--blue) !important;
      }
      [data-mf-mode="dark"] .super-nueva-btn{
        border-color: rgba(138,156,255,.26) !important;
        background: linear-gradient(135deg, rgba(36,50,85,.86), rgba(25,33,58,.88)) !important;
        color: #ffc04d !important;
      }
      [data-mf-mode="dark"] .super-borrar-btn{
        border-color: rgba(255,112,138,.26) !important;
        background: rgba(255,112,138,.08) !important;
        color: var(--red) !important;
      }
      [data-mf-mode="dark"] .super-total-inner{
        background: linear-gradient(135deg, rgba(10,23,37,.96), rgba(12,19,43,.96)) !important;
      }
      [data-mf-mode="dark"] .super-total-label,
      [data-mf-mode="dark"] .super-table th,
      [data-mf-mode="dark"] .super-table-footer{
        color: #c2cbef !important;
      }
      [data-mf-mode="dark"] .mes-nav button:hover,
      [data-mf-mode="dark"] .super-add-btn:hover,
      [data-mf-mode="dark"] .super-nueva-btn:hover{
        background: var(--card2) !important;
      }
      [data-mf-mode="dark"] .sticky-bar{
        background: var(--chrome-strong) !important;
        border-bottom-color: rgba(255,255,255,.06) !important;
        box-shadow: 0 8px 24px rgba(0,0,0,.35) !important;
      }
      [data-mf-mode="dark"] .loading-overlay{
        background: rgba(4,8,15,.88) !important;
      }
      [data-mf-mode="dark"] .action-btn{
        color: #b6c0df !important;
      }
      [data-mf-mode="dark"] .action-btn:hover{
        background: rgba(138,156,255,.12) !important;
      }
      [data-mf-mode="dark"] .tab{
        color: var(--muted) !important;
      }
      [data-mf-mode="dark"] .tab.active{
        background: none !important;
        -webkit-background-clip: initial !important;
        background-clip: initial !important;
        -webkit-text-fill-color: initial !important;
        color: var(--blue) !important;
        text-shadow: 0 0 16px var(--line-glow-soft);
        border-bottom-color: var(--blue) !important;
      }
      [data-mf-mode="dark"] .sum-card .label,
      [data-mf-mode="dark"] .sync-label,
      [data-mf-mode="dark"] .sem-header .sem-fechas,
      [data-mf-mode="dark"] .usd-pill-label,
      [data-mf-mode="dark"] .usd-pill-sub,
      [data-mf-mode="dark"] .fijo-section-title,
      [data-mf-mode="dark"] .tarjetas-manager-title,
      [data-mf-mode="dark"] .mes-resumen-item .r-label,
      [data-mf-mode="dark"] .det-sem-fechas{
        color: var(--muted) !important;
      }
      [data-mf-mode="dark"] .mov-item,
      [data-mf-mode="dark"] .fijo-item,
      [data-mf-mode="dark"] .tarjeta-list-item,
      [data-mf-mode="dark"] .det-mov,
      [data-mf-mode="dark"] .det-tar-item,
      [data-mf-mode="dark"] .tar-gasto-item,
      [data-mf-mode="dark"] .pago-item{
        border-color: rgba(255,255,255,.08) !important;
      }
      [data-mf-mode="dark"] .sum-card:hover{
        box-shadow: 0 0 0 1px var(--border), 0 0 24px var(--line-glow-strong), 0 22px 56px rgba(0,0,0,.5) !important;
      }
    `;
    document.head.appendChild(style);
    return style;
  }

  function buildVars(theme){
    const safeTheme = clampTheme(theme);
    const mode = modeProfiles[safeTheme.mode];
    const border = lineProfiles[safeTheme.lines];
    const lineMotion = lineMotionProfiles[safeTheme.lineMotion];
    const effect = effectProfiles[safeTheme.effects];
    const button = buttonProfiles[safeTheme.buttons];
    const general = generalProfiles[safeTheme.general];
    const bodyBg = backgroundProfiles[safeTheme.background];
    return {
      '--bg': mode.bg,
      '--bg2': mode.bg2,
      '--card': mode.card,
      '--card2': mode.card2,
      '--card-soft': mode.cardSoft,
      '--chrome-bg': mode.chrome,
      '--chrome-strong': mode.chromeStrong,
      '--surface-alt': mode.surfaceAlt,
      '--border': border,
      '--text': mode.text,
      '--muted': mode.muted,
      '--accent': button.from,
      '--accent2': effect,
      '--green': mode.success,
      '--red': mode.red,
      '--blue': general,
      '--yellow': mode.yellow,
      '--input-bg': mode.inputBg,
      '--overlay-soft': mode.overlay,
      '--body-bg': bodyBg,
      '--button-gradient': 'linear-gradient(135deg, ' + button.from + ', ' + button.to + ')',
      '--button-from': button.from,
      '--button-to': button.to,
      '--button-shadow': hexToRgba(button.to, 0.42),
      '--focus-ring': hexToRgba(general, 0.24),
      '--surface-shadow': hexToRgba(effect, 0.24),
      '--line-animation-name': lineMotion.animation,
      '--line-animation-duration': lineMotion.duration,
      '--line-glow-soft': hexToRgba(effect, lineMotion.glowSoft),
      '--line-glow-strong': hexToRgba(effect, lineMotion.glowStrong),
      '--line-tint': hexToRgba(border, lineMotion.opacity),
      '--line-glow-accent-a': hexToRgba(button.from, lineMotion.glowStrong),
      '--line-glow-accent-b': hexToRgba(button.to, lineMotion.glowStrong),
      '--line-glow-accent-c': hexToRgba(general, lineMotion.glowStrong)
    };
  }

  function applyTheme(theme, persist){
    const safeTheme = clampTheme(theme);
    const vars = buildVars(safeTheme);
    ensureRuntimeStyle();
    Object.entries(vars).forEach(([key, value]) => {
      document.documentElement.style.setProperty(key, value);
    });
    document.documentElement.dataset.mfMode = safeTheme.mode;
    currentTheme = safeTheme;
    if(persist !== false){
      writeTheme(safeTheme);
    }
    return safeTheme;
  }

  function applyPreset(presetKey, options){
    const preset = presetProfiles[presetKey];
    if(!preset) return currentTheme || readTheme();
    const next = clampTheme({ preset: presetKey, ...preset });
    return applyTheme(next, !options || options.persist !== false);
  }

  function updateCategory(category, value, options){
    if(category === 'preset'){
      return applyPreset(value, options);
    }
    const next = clampTheme({
      ...(currentTheme || readTheme()),
      [category]: value,
      preset: 'custom'
    });
    return applyTheme(next, !options || options.persist !== false);
  }

  function getCatalog(){
    return JSON.parse(JSON.stringify(catalog));
  }

  window.MisFinanzasTheme = {
    STORAGE_KEY,
    defaultTheme: { ...defaultTheme },
    getCatalog,
    getCurrent(){
      return { ...(currentTheme || readTheme()) };
    },
    setTheme(theme, options){
      return applyTheme(theme, !options || options.persist !== false);
    },
    applyPreset,
    updateCategory,
    resetTheme(options){
      return applyPreset(defaultTheme.preset, options);
    },
    loadTheme(){
      return readTheme();
    }
  };

  applyTheme(readTheme(), false);
})();
