'use strict';
const $ = (s) => document.querySelector(s),
  esc = (s) =>
    String(s ?? '').replace(
      /[&<>"']/g,
      (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
    ),
  norm = (s) =>
    String(s || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();
let menu,
  state,
  categories = new Map(),
  busy = new Set(),
  featuresBusy = false,
  stockFilter = 'all',
  toastTimer;
const DAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
function notify(s) {
  $('#toast').textContent = s;
  $('#toast').hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => ($('#toast').hidden = true), 3500);
}
async function post(route, data) {
  const r = await fetch('/api/admin/' + route, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const d = await r.json();
  if (!r.ok) throw Error(d.error || 'No se pudo guardar.');
  return d;
}
function override(p) {
  return state.stock.find(
    (x) => x.id === p.id && (!x.expiresAt || Date.parse(x.expiresAt) > Date.now()),
  );
}
function available(p) {
  const s = override(p);
  return s ? s.state === 'available' : p.isAvailable;
}
function productRow(p) {
  const o = override(p),
    featured = state.featured.includes(p.id),
    on = available(p),
    off = busy.has(p.id) ? 'disabled' : '',
    note = o
      ? o.expiresAt
        ? 'Por hoy · vuelve al estado original a medianoche'
        : 'Cambio manual · se mantiene hasta que lo reactives'
      : p.isAvailable
        ? ''
        : 'Sin stock en la carta original';
  const action = (mode, label, pressed, extra = '') =>
    `<button${extra} data-stock="${mode}" data-id="${p.id}" aria-pressed="${pressed}" ${off}>${label}</button>`;
  return `<article class="admin-item" data-id="${p.id}"><img src="${esc(state.images?.[p.id] || p.image)}" width="85" height="105" alt="" loading="lazy"><div class="admin-name-row"><span class="admin-type">${esc(categories.get(p.productCategoryId) || '')}</span><h3>${esc(p.name)}</h3><p class="stock-state${on ? '' : ' out'}"><strong>${on ? 'Disponible' : 'Sin stock'}</strong>${note ? `<span class="stock-note">${note}</span>` : ''}</p><button class="feature-toggle" data-feature="${p.id}" aria-pressed="${featured}" ${featuresBusy ? 'disabled' : ''}>${featured ? '★ Favorito de la casa' : '☆ Destacar como favorito'}</button></div><div class="stock-actions" role="group" aria-label="Disponibilidad de ${esc(p.name)}">${action('today', 'Sin stock por hoy', !!o && o.state === 'unavailable' && !!o.expiresAt)}${action('permanent', 'Sin stock hasta reactivar', !!o && o.state === 'unavailable' && !o.expiresAt)}${action('available', 'Marcar disponible', !!o && o.state === 'available')}${o ? action('source', 'Volver al estado de la carta', false, ' class="restore"') : ''}</div><label class="photo-upload-label">Reemplazar por foto propia<input type="file" data-photo="${p.id}" aria-label="Reemplazar foto de ${esc(p.name)}" accept="image/jpeg,image/png,image/webp"></label><p class="save-indicator" role="status">${busy.has(p.id) ? 'Guardando…' : ''}</p></article>`;
}
function renderSummary() {
  const out = menu.products.filter((p) => !available(p)).length,
    manual = menu.products.filter((p) => override(p)).length;
  $('#admin-summary').innerHTML =
    `<span><strong>${out}</strong> sin stock ahora</span><span><strong>${manual}</strong> con cambio manual</span><span><strong>${state.featured.length}</strong> de 16 favoritos</span>`;
}
function render() {
  const q = norm($('#admin-search').value),
    cat = $('#admin-category').value,
    filter = stockFilter;
  const list = menu.products.filter(
    (p) =>
      (cat === 'all' || String(p.productCategoryId) === cat) &&
      norm([p.name, p.description, categories.get(p.productCategoryId)].join(' ')).includes(q) &&
      (filter === 'all' ||
        (filter === 'unavailable' && !available(p)) ||
        (filter === 'overridden' && override(p)) ||
        (filter === 'featured' && state.featured.includes(p.id))),
  );
  renderSummary();
  document
    .querySelectorAll('#admin-stock-filter [data-filter]')
    .forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.filter === stockFilter)));
  $('#admin-count').textContent = list.length + (list.length === 1 ? ' producto' : ' productos');
  $('#admin-products-list').innerHTML = list.length
    ? list.map(productRow).join('')
    : '<div class="admin-empty">No encontramos productos con estos filtros.</div>';
}
function renderHours() {
  $('#hours-confirmed').checked = !!state.hours;
  $('#hours-fields').innerHTML = [1, 2, 3, 4, 5, 6, 0]
    .map((d) => {
      const h = state.hours?.[d];
      return `<div class="hours-field" data-day="${d}"><span>${DAYS[d]}</span><label class="day-closed"><input type="checkbox" data-closed="${d}" ${h?.closed ? 'checked' : ''}>Cerrado</label><label>Apertura<input aria-label="Apertura ${DAYS[d]}" type="time" data-open="${d}" value="${h?.open || ''}" ${h?.closed ? 'disabled' : ''}></label><label>Cierre<input aria-label="Cierre ${DAYS[d]}" type="time" data-close="${d}" value="${h?.close || ''}" ${h?.closed ? 'disabled' : ''}></label></div>`;
    })
    .join('');
}
async function uploadPhoto(file, target) {
  if (!file) throw Error('Selecciona una fotografía.');
  if (file.size > 4 * 1024 * 1024 || !['image/jpeg', 'image/png', 'image/webp'].includes(file.type))
    throw Error('Usa JPG, PNG o WebP de hasta 4 MB.');
  const f = new FormData();
  f.set('target', target);
  f.set('file', file);
  const r = await fetch('/api/admin/photo', { method: 'POST', body: f }),
    d = await r.json();
  if (!r.ok) throw Error(d.error || 'No se pudo guardar la foto.');
  return d;
}
$('#admin-products-list').addEventListener('click', async (e) => {
  const b = e.target.closest('[data-stock]'),
    f = e.target.closest('[data-feature]');
  if (b) {
    const id = +b.dataset.id;
    if (busy.has(id)) return;
    busy.add(id);
    b.closest('article').querySelector('.save-indicator').textContent = 'Guardando…';
    b.closest('article')
      .querySelectorAll('[data-stock]')
      .forEach((x) => (x.disabled = true));
    try {
      const mode = b.dataset.stock;
      state = await post('stock', {
        id,
        state: mode === 'source' ? 'source' : mode === 'available' ? 'available' : 'unavailable',
        duration: mode === 'today' ? 'today' : 'permanent',
      });
      notify(
        mode === 'source'
          ? 'Estado original restaurado'
          : 'Disponibilidad guardada para todos los dispositivos',
      );
    } catch (err) {
      notify(err.message);
    } finally {
      busy.delete(id);
      render();
      $(`#admin-products-list [data-id="${id}"][data-stock="${b.dataset.stock}"]`)?.focus();
    }
  }
  if (f) {
    if (featuresBusy) return;
    const id = +f.dataset.feature,
      ids = state.featured.includes(id)
        ? state.featured.filter((x) => x !== id)
        : [...state.featured, id];
    if (ids.length > 16) {
      notify('La selección puede tener hasta 16 favoritos.');
      return;
    }
    featuresBusy = true;
    f.disabled = true;
    try {
      state = await post('settings', { featured: ids });
      notify('Selección de favoritos guardada');
    } catch (err) {
      notify(err.message);
    } finally {
      featuresBusy = false;
      render();
      $(`#admin-products-list [data-feature="${id}"]`)?.focus();
    }
  }
});
$('#admin-products-list').addEventListener('change', async (e) => {
  const input = e.target.closest('[data-photo]');
  if (!input) return;
  const id = input.dataset.photo;
  input.disabled = true;
  const msg = input.closest('article').querySelector('.save-indicator');
  msg.textContent = 'Guardando foto…';
  try {
    const d = await uploadPhoto(input.files[0], id);
    state.images[id] = d.url;
    notify('Fotografía guardada');
    render();
  } catch (err) {
    msg.textContent = err.message;
    input.disabled = false;
  }
});
$('#hours-fields').addEventListener('change', (e) => {
  if (e.target.matches('[data-closed]')) {
    const d = e.target.dataset.closed;
    document.querySelector(`[data-open="${d}"]`).disabled = e.target.checked;
    document.querySelector(`[data-close="${d}"]`).disabled = e.target.checked;
  }
});
$('#hours-form').onsubmit = async (e) => {
  e.preventDefault();
  const button = e.submitter;
  $('#hours-save-result').textContent = '';
  if (!$('#hours-confirmed').checked) {
    $('#hours-save-result').textContent =
      'Confirma que los horarios fueron revisados con el restaurante.';
    return;
  }
  const hours = Array.from({ length: 7 }, (_, d) => ({
    closed: document.querySelector(`[data-closed="${d}"]`).checked,
    open: document.querySelector(`[data-open="${d}"]`).value,
    close: document.querySelector(`[data-close="${d}"]`).value,
  }));
  if (hours.some((h) => !h.closed && (!h.open || !h.close || h.open === h.close))) {
    $('#hours-save-result').textContent =
      'Completa apertura y cierre de cada día o márcalo como cerrado.';
    return;
  }
  button.disabled = true;
  try {
    state = await post('settings', { hours });
    $('#hours-save-result').textContent =
      'Horarios guardados. El reloj y el estado de apertura se actualizarán en la carta.';
  } catch (err) {
    $('#hours-save-result').textContent = err.message;
  } finally {
    button.disabled = false;
  }
};
$('#clear-hours').onclick = async (e) => {
  e.target.disabled = true;
  try {
    state = await post('settings', { hours: null });
    renderHours();
    $('#hours-save-result').textContent = 'Los horarios quedan por confirmar.';
  } catch (err) {
    $('#hours-save-result').textContent = err.message;
  } finally {
    e.target.disabled = false;
  }
};
$('#save-location-photo').onclick = async (e) => {
  e.target.disabled = true;
  $('#location-save-result').textContent = 'Guardando…';
  try {
    await uploadPhoto($('#location-photo').files[0], 'location');
    $('#location-save-result').textContent =
      'Foto del local guardada para la sección de ubicación.';
  } catch (err) {
    $('#location-save-result').textContent = err.message;
  } finally {
    e.target.disabled = false;
  }
};
$('#admin-search').oninput = render;
$('#admin-category').onchange = render;
$('#admin-stock-filter').onclick = (e) => {
  const b = e.target.closest('[data-filter]');
  if (!b) return;
  stockFilter = b.dataset.filter;
  render();
};
$('#copy-monday').onclick = () => {
  const closed = document.querySelector('[data-closed="1"]').checked,
    open = document.querySelector('[data-open="1"]').value,
    close = document.querySelector('[data-close="1"]').value;
  for (let d = 0; d < 7; d++) {
    document.querySelector(`[data-closed="${d}"]`).checked = closed;
    document.querySelector(`[data-open="${d}"]`).value = open;
    document.querySelector(`[data-close="${d}"]`).value = close;
    document.querySelector(`[data-open="${d}"]`).disabled = closed;
    document.querySelector(`[data-close="${d}"]`).disabled = closed;
  }
  $('#hours-save-result').textContent =
    'Horario copiado. Revisa cada día y guarda cuando estén confirmados.';
};
(async () => {
  try {
    const r = await fetch('/api/session'),
      s = await r.json();
    if (!s.canManage) {
      $('#access-message').textContent =
        'Esta sección está reservada para las cuentas administradoras autorizadas.';
      return;
    }
    const [mr, sr] = await Promise.all([
      fetch('/menu.json', { cache: 'no-store' }),
      fetch('/api/state'),
    ]);
    if (!mr.ok || !sr.ok) throw Error('No pudimos cargar la administración.');
    menu = await mr.json();
    state = await sr.json();
    if (!state.storageReady)
      throw Error('El almacenamiento no está listo. Los cambios están bloqueados.');
    categories = new Map(menu.categories.map((c) => [c.id, c.name]));
    $('#admin-category').innerHTML =
      '<option value="all">Todas las categorías</option>' +
      menu.categories
        .filter((c) => menu.products.some((p) => p.productCategoryId === c.id))
        .map((c) => `<option value="${c.id}">${esc(c.name)}</option>`)
        .join('');
    $('#access-message').hidden = true;
    $('#admin-content').hidden = false;
    render();
    renderHours();
  } catch (err) {
    $('#access-message').textContent = err.message;
  }
})();
