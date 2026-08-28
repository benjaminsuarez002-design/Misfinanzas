const JSON_HEADERS = { 'content-type': 'application/json; charset=utf-8' };

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/voz') url.pathname = '/';
    else if (url.pathname.startsWith('/voz/')) url.pathname = url.pathname.slice(4);

    if (request.method === 'OPTIONS') return corsResponse(null, 204);

    try {
      if (request.method === 'GET' && url.pathname === '/health') {
        return json({ ok: true, service: 'misfinanzas-carga-rapida' });
      }

      if (request.method === 'POST' && url.pathname === '/devices/pair') {
        const uid = await requireFirebaseUser(request, env);
        return pairDevice(request, env, uid);
      }

      if (request.method === 'POST' && url.pathname === '/capture') {
        return createCapture(request, env);
      }

      if (request.method === 'GET' && url.pathname === '/captures') {
        const uid = await requireFirebaseUser(request, env);
        return listCaptures(env, uid);
      }

      const captureMatch = url.pathname.match(/^\/captures\/([^/]+)$/);
      if (request.method === 'PATCH' && captureMatch) {
        const uid = await requireFirebaseUser(request, env);
        return resolveCapture(request, env, uid, decodeURIComponent(captureMatch[1]));
      }

      return json({ ok: false, error: 'Ruta no encontrada.' }, 404);
    } catch (error) {
      const status = Number(error?.status) || 500;
      const message = status >= 500 ? 'No se pudo completar la operación.' : error.message;
      console.error('voice-capture-worker', status, error?.message || error);
      return json({ ok: false, error: message }, status);
    }
  }
};

async function pairDevice(request, env, uid) {
  const body = await readJson(request);
  const label = cleanText(body.label || 'Siri', 40) || 'Siri';
  const token = randomToken();
  const tokenHash = await sha256(token);
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  await env.DB.prepare(
    `INSERT INTO voice_devices (id, user_uid, label, token_hash, created_at)
     VALUES (?, ?, ?, ?, ?)`
  ).bind(id, uid, label, tokenHash, now).run();

  return json({
    ok: true,
    device: { id, label },
    token,
    note: 'Este token se muestra una sola vez.'
  }, 201);
}

async function createCapture(request, env) {
  const body = await readJson(request);
  const token = String(request.headers.get('x-voice-token') || body.token || '').trim();
  if (!token) throw httpError(401, 'Falta vincular el Atajo con Mis Finanzas.');

  const tokenHash = await sha256(token);
  const device = await env.DB.prepare(
    `SELECT id, user_uid FROM voice_devices WHERE token_hash = ? LIMIT 1`
  ).bind(tokenHash).first();
  if (!device) throw httpError(401, 'El Atajo no está autorizado.');

  const rawText = cleanText(body.text, 300);
  if (!rawText) throw httpError(400, 'No se recibió ningún movimiento.');

  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  await env.DB.batch([
    env.DB.prepare(
      `INSERT INTO voice_captures
       (id, user_uid, device_id, raw_text, status, source, created_at)
       VALUES (?, ?, ?, ?, 'pending', 'siri', ?)`
    ).bind(id, device.user_uid, device.id, rawText, now),
    env.DB.prepare(
      `UPDATE voice_devices SET last_used_at = ? WHERE id = ?`
    ).bind(now, device.id)
  ]);

  return json({ ok: true, id, message: 'Listo, lo guardé.' }, 201);
}

async function listCaptures(env, uid) {
  const result = await env.DB.prepare(
    `SELECT id, raw_text, source, created_at
       FROM voice_captures
      WHERE user_uid = ? AND status = 'pending'
      ORDER BY created_at ASC
      LIMIT 100`
  ).bind(uid).all();

  return json({ ok: true, items: result.results || [] });
}

async function resolveCapture(request, env, uid, id) {
  const body = await readJson(request);
  const status = body.status;
  if (!['processed', 'discarded'].includes(status)) {
    throw httpError(400, 'Estado inválido.');
  }

  const now = new Date().toISOString();
  const result = await env.DB.prepare(
    `UPDATE voice_captures
        SET status = ?, resolved_at = ?
      WHERE id = ? AND user_uid = ? AND status = 'pending'`
  ).bind(status, now, id, uid).run();

  if (!result.meta?.changes) throw httpError(404, 'La carga rápida no existe o ya fue resuelta.');
  return json({ ok: true });
}

async function requireFirebaseUser(request, env) {
  const auth = request.headers.get('authorization') || '';
  const match = auth.match(/^Bearer\s+(.+)$/i);
  if (!match) throw httpError(401, 'La sesión de Mis Finanzas es obligatoria.');

  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(env.FIREBASE_API_KEY)}`,
    {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify({ idToken: match[1] })
    }
  );
  if (!response.ok) throw httpError(401, 'La sesión venció. Volvé a ingresar en Mis Finanzas.');

  const payload = await response.json();
  const uid = payload.users?.[0]?.localId;
  if (!uid) throw httpError(401, 'No se pudo identificar al usuario.');
  return uid;
}

async function readJson(request) {
  try {
    return await request.json();
  } catch {
    throw httpError(400, 'El contenido enviado no es válido.');
  }
}

function cleanText(value, maxLength) {
  return String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, maxLength);
}

function randomToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

async function sha256(value) {
  const data = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(digest)]
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('');
}

function httpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function json(body, status = 200) {
  return corsResponse(JSON.stringify(body), status, JSON_HEADERS);
}

function corsResponse(body, status, headers = {}) {
  return new Response(body, {
    status,
    headers: {
      ...headers,
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'GET, POST, PATCH, OPTIONS',
      'access-control-allow-headers': 'authorization, content-type, x-voice-token',
      'cache-control': 'no-store'
    }
  });
}
