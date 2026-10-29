const PROJECT = 'finanzas-51439';
const encoder = new TextEncoder();
const headers = { 'content-type': 'application/json' };
let cachedAccess;

function fail(status, message) { return Object.assign(new Error(message), { status }); }
function base64url(bytes) { return btoa(String.fromCharCode(...bytes)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_'); }
async function hash(value) { return base64url(new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(value)))); }

async function accessToken(env) {
  if (cachedAccess?.expires > Date.now()) return cachedAccess.token;
  const service = JSON.parse(env.GOOGLE_PUSH_SERVICE_ACCOUNT);
  const now = Math.floor(Date.now() / 1000);
  const encoded = value => base64url(encoder.encode(JSON.stringify(value)));
  const unsigned = `${encoded({ alg: 'RS256', typ: 'JWT' })}.${encoded({ iss: service.client_email,
    scope: 'https://www.googleapis.com/auth/firebase.messaging https://www.googleapis.com/auth/datastore',
    aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600 })}`;
  const pem = service.private_key.replace(/-----[^-]+-----/g, '').replace(/\s/g, '');
  const key = await crypto.subtle.importKey('pkcs8', Uint8Array.from(atob(pem), c => c.charCodeAt(0)),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
  const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, encoder.encode(unsigned));
  const response = await fetch('https://oauth2.googleapis.com/token', { method: 'POST',
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: `${unsigned}.${base64url(new Uint8Array(signature))}` }) });
  const data = await response.json();
  if (!response.ok || !data.access_token) throw fail(503, 'No se pudo autorizar el envío de avisos.');
  cachedAccess = { token: data.access_token, expires: Date.now() + 3300000 };
  return cachedAccess.token;
}

async function send(env, token, title, body, eventId) {
  const response = await fetch(`https://fcm.googleapis.com/v1/projects/${PROJECT}/messages:send`, {
    method: 'POST', headers: { ...headers, authorization: `Bearer ${await accessToken(env)}` },
    body: JSON.stringify({ message: { token, notification: { title, body }, data: { eventId },
      android: { notification: { channel_id: 'misfinanzas_avisos', icon: 'ic_money', tag: eventId } } } })
  });
  if (!response.ok) {
    const data = await response.json();
    const unregistered = data.error?.details?.some(d => d.errorCode === 'UNREGISTERED');
    throw Object.assign(fail(503, 'No se pudo enviar la notificación al teléfono.'), { unregistered });
  }
}

export async function registerPushDevice(data, env, uid) {
  const { token, enabled = true, test = false } = data || {};
  if (typeof token !== 'string' || token.length < 20 || token.length > 4096) throw fail(400, 'Token inválido.');
  const id = await hash(token);
  if (enabled === false) {
    await env.DB.prepare('DELETE FROM android_push_devices WHERE id=? AND user_uid=?').bind(id, uid).run();
    return { ok: true };
  }
  await env.DB.prepare(`INSERT INTO android_push_devices(id,user_uid,token,updated_at) VALUES(?,?,?,?)
    ON CONFLICT(id) DO UPDATE SET user_uid=excluded.user_uid,token=excluded.token,updated_at=excluded.updated_at`)
    .bind(id, uid, token, new Date().toISOString()).run();
  if (test === true) {
    const now = Date.now();
    const result = await env.DB.prepare('UPDATE android_push_devices SET last_test_at=? WHERE id=? AND last_test_at<?').bind(now, id, now - 60000).run();
    if (!result.meta.changes) throw fail(429, 'Esperá un minuto antes de repetir la prueba.');
    await send(env, token, 'Notificaciones activadas', 'Mis Finanzas ya puede avisarte en este teléfono.', `test-${now}`);
  }
  return { ok: true };
}

function localDate(offset) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Argentina/Buenos_Aires', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
  const get = type => parts.find(p => p.type === type).value;
  const date = new Date(`${get('year')}-${get('month')}-${get('day')}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + offset);
  return date.toISOString().slice(0, 10);
}

export async function runPushReminders(env) {
  const devices = (await env.DB.prepare('SELECT * FROM android_push_devices').all()).results;
  const users = new Set(devices.map(d => d.user_uid));
  const today = localDate(0), inThree = localDate(3);
  for (const uid of users) {
    try {
      const response = await fetch(`https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents/usuarios/${encodeURIComponent(uid)}:runQuery`, {
        method: 'POST', headers: { ...headers, authorization: `Bearer ${await accessToken(env)}` },
        body: JSON.stringify({ structuredQuery: { from: [{ collectionId: 'movimientos' }],
          where: { fieldFilter: { field: { fieldPath: 'recordatorio' }, op: 'EQUAL', value: { booleanValue: true } } } } })
      });
      if (!response.ok) throw new Error(`Firestore ${response.status}`);
      for (const row of await response.json()) {
        const doc = row.document;
        if (!doc) continue;
        const fields = doc.fields || {}, date = fields.fecha?.stringValue;
        if (![today, inThree].includes(date) || fields.confirmado?.booleanValue === true) continue;
        for (const device of devices.filter(d => d.user_uid === uid)) {
          const eventId = await hash(`${doc.name}:${date}:${date === today ? 0 : 3}:${device.id}`);
          const claim = await env.DB.prepare('INSERT OR IGNORE INTO android_push_receipts(id,created_at) VALUES(?,?)').bind(eventId, new Date().toISOString()).run();
          if (!claim.meta.changes) continue;
          try {
            await send(env, device.token, date === today ? 'Vence hoy' : 'Vence en 3 días', (fields.desc?.stringValue || 'Movimiento pendiente').slice(0, 160), eventId);
          } catch (error) {
            await env.DB.prepare('DELETE FROM android_push_receipts WHERE id=?').bind(eventId).run();
            if (error.unregistered) await env.DB.prepare('DELETE FROM android_push_devices WHERE id=?').bind(device.id).run();
            else console.error('push-send', error.message);
          }
        }
      }
    } catch (error) { console.error('push-reminders', error.message); }
  }
  await env.DB.prepare("DELETE FROM android_push_receipts WHERE created_at < datetime('now','-90 days')").run();
}
