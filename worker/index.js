const ASSETS = __SITE_ASSETS__;
const BASE_MENU = __SITE_MENU__;
const IDS = new Set(BASE_MENU.products.map((p) => p.id));
const DEFAULT_SETTINGS = { featured: [472, 426, 362, 205], hours: null, locationPhoto: false };
const json = (d, status = 200) =>
  new Response(JSON.stringify(d), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
    },
  });
function canManage(req, env) {
  const email = req.headers.get('oai-authenticated-user-email')?.trim().toLowerCase();
  return (
    !!email &&
    String(env.ADMIN_EMAILS || '')
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .includes(email)
  );
}
async function readJSON(bucket, key) {
  const o = await bucket.get(key);
  return o ? o.json() : null;
}
function nextMidnight() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Santiago',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const p = Object.fromEntries(parts.map((x) => [x.type, x.value]));
  const target = Date.UTC(+p.year, +p.month - 1, +p.day + 1);
  let t = target;
  for (let i = 0; i < 3; i++) {
    const q = Object.fromEntries(
      new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Santiago',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hourCycle: 'h23',
      })
        .formatToParts(new Date(t))
        .map((x) => [x.type, x.value]),
    );
    const local = Date.UTC(+q.year, +q.month - 1, +q.day, +q.hour, +q.minute, +q.second);
    t += target - local;
  }
  return new Date(t).toISOString();
}
async function state(bucket) {
  if (!bucket) return { ...DEFAULT_SETTINGS, stock: [], images: {}, storageReady: false };
  const list = await bucket.list({ prefix: 'stock/' });
  const stock = (await Promise.all(list.objects.map((o) => readJSON(bucket, o.key)))).filter(
    (x) => x && (!x.expiresAt || Date.parse(x.expiresAt) > Date.now()),
  );
  const settings = (await readJSON(bucket, 'settings.json')) || DEFAULT_SETTINGS;
  const photos = await bucket.list({ prefix: 'photos/product-' });
  const images = Object.fromEntries(
    photos.objects.map((o) => [
      o.key.replace('photos/product-', ''),
      '/media/' + o.key.slice(7) + '?v=' + encodeURIComponent(o.etag || o.uploaded || ''),
    ]),
  );
  return { ...DEFAULT_SETTINGS, ...settings, stock, images, storageReady: true };
}
function validateHours(h) {
  if (h === null) return null;
  if (!Array.isArray(h) || h.length !== 7) throw Error('Deben configurarse los siete días.');
  return h.map((x) => {
    if (x.closed === true) return { closed: true };
    if (
      !/^([01]\d|2[0-3]):[0-5]\d$/.test(x.open) ||
      !/^([01]\d|2[0-3]):[0-5]\d$/.test(x.close) ||
      x.open === x.close
    )
      throw Error('Revisa las horas de apertura y cierre.');
    return { closed: false, open: x.open, close: x.close };
  });
}
export default {
  async fetch(req, env) {
    try {
      const u = new URL(req.url),
        path = u.pathname;
      if (path === '/api/session') return json({ canManage: canManage(req, env) });
      if (path === '/api/state' && req.method === 'GET') return json(await state(env.BUCKET));
      if (path.startsWith('/api/admin/')) {
        if (!canManage(req, env)) return json({ error: 'Acceso de administrador requerido.' }, 403);
        if (!env.BUCKET) return json({ error: 'El almacenamiento no está disponible.' }, 503);
        if (req.method !== 'POST') return json({ error: 'Método no permitido.' }, 405);
        if (
          req.headers.get('origin') &&
          ![u.origin, 'https://santa-elena-carta-digital.bombvstic.chatgpt.site'].includes(
            req.headers.get('origin'),
          )
        )
          return json({ error: 'Origen no permitido.' }, 403);
        const size = +(req.headers.get('content-length') || 0);
        if (size > 5 * 1024 * 1024) return json({ error: 'Archivo demasiado grande.' }, 413);
        if (path === '/api/admin/photo') {
          const form = await req.formData(),
            file = form.get('file'),
            target = String(form.get('target') || '');
          if (
            !file ||
            typeof file === 'string' ||
            file.size > 4 * 1024 * 1024 ||
            !['image/jpeg', 'image/png', 'image/webp'].includes(file.type)
          )
            return json({ error: 'Usa una foto JPG, PNG o WebP de hasta 4 MB.' }, 400);
          if (target !== 'location' && !IDS.has(Number(target)))
            return json({ error: 'Producto no válido.' }, 400);
          const bytes = new Uint8Array(await file.arrayBuffer());
          const valid =
            file.type === 'image/jpeg'
              ? bytes[0] === 255 && bytes[1] === 216
              : file.type === 'image/png'
                ? bytes[0] === 137 && bytes[1] === 80 && bytes[2] === 78
                : String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' &&
                  String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP';
          if (!valid)
            return json({ error: 'El contenido del archivo no coincide con su formato.' }, 400);
          const key = 'photos/' + (target === 'location' ? 'location' : 'product-' + target);
          await env.BUCKET.put(key, bytes, { httpMetadata: { contentType: file.type } });
          if (target === 'location') {
            const s = (await readJSON(env.BUCKET, 'settings.json')) || DEFAULT_SETTINGS;
            await env.BUCKET.put(
              'settings.json',
              JSON.stringify({ ...s, locationPhoto: true, locationVersion: Date.now() }),
              { httpMetadata: { contentType: 'application/json' } },
            );
          }
          return json({ ok: true, url: '/media/' + key.slice(7) + '?v=' + Date.now() });
        }
        if (!req.headers.get('content-type')?.includes('application/json'))
          return json({ error: 'Formato no permitido.' }, 415);
        const raw = await req.text();
        if (raw.length > 12000) return json({ error: 'Solicitud demasiado grande.' }, 413);
        let body;
        try {
          body = JSON.parse(raw);
        } catch {
          return json({ error: 'JSON no válido.' }, 400);
        }
        if (path === '/api/admin/stock') {
          const id = Number(body.id);
          if (
            !IDS.has(id) ||
            !['source', 'available', 'unavailable'].includes(body.state) ||
            !['today', 'permanent', undefined].includes(body.duration)
          )
            return json({ error: 'Cambio de stock no válido.' }, 400);
          if (body.state === 'source') await env.BUCKET.delete('stock/' + id + '.json');
          else
            await env.BUCKET.put(
              'stock/' + id + '.json',
              JSON.stringify({
                id,
                state: body.state,
                expiresAt: body.duration === 'today' ? nextMidnight() : null,
                updatedAt: new Date().toISOString(),
              }),
              { httpMetadata: { contentType: 'application/json' } },
            );
          return json({ ok: true, ...(await state(env.BUCKET)) });
        }
        if (path === '/api/admin/settings') {
          const settings = (await readJSON(env.BUCKET, 'settings.json')) || DEFAULT_SETTINGS;
          if (body.featured !== undefined) {
            if (
              !Array.isArray(body.featured) ||
              body.featured.length > 16 ||
              !body.featured.every((id) => Number.isInteger(id) && IDS.has(id))
            )
              return json({ error: 'Selección de favoritos no válida.' }, 400);
            settings.featured = [...new Set(body.featured)];
          }
          if (body.hours !== undefined) {
            try {
              settings.hours = validateHours(body.hours);
            } catch (e) {
              return json({ error: e.message }, 400);
            }
          }
          await env.BUCKET.put('settings.json', JSON.stringify(settings), {
            httpMetadata: { contentType: 'application/json' },
          });
          return json({ ok: true, ...(await state(env.BUCKET)) });
        }
        return json({ error: 'Ruta no encontrada.' }, 404);
      }
      if (path.startsWith('/media/')) {
        const key = path.slice(7);
        if (!/^(location|product-\d+)$/.test(key))
          return new Response('Not found', { status: 404 });
        const obj = await env.BUCKET?.get('photos/' + key);
        if (!obj) return new Response('Not found', { status: 404 });
        return new Response(obj.body, {
          headers: {
            'content-type': obj.httpMetadata?.contentType || 'image/jpeg',
            'cache-control': 'private, max-age=300',
            'x-content-type-options': 'nosniff',
          },
        });
      }
      if (req.method !== 'GET' && req.method !== 'HEAD')
        return new Response('Method not allowed', { status: 405 });
      const key =
        path === '/'
          ? 'index.html'
          : path === '/admin'
            ? 'admin.html'
            : decodeURIComponent(path).slice(1);
      const a = ASSETS[key];
      if (!a) return new Response('Not found', { status: 404 });
      const b = Uint8Array.from(atob(a.data), (c) => c.charCodeAt(0));
      return new Response(req.method === 'HEAD' ? null : b, {
        headers: {
          'content-type': a.type,
          'cache-control':
            key.endsWith('.html') || key.endsWith('.json') ? 'no-cache' : 'private, max-age=86400',
          'x-content-type-options': 'nosniff',
          'referrer-policy': 'strict-origin-when-cross-origin',
        },
      });
    } catch (e) {
      console.error('Request failed', e?.message);
      return json({ error: 'No se pudo completar la solicitud. Inténtalo de nuevo.' }, 500);
    }
  },
};
