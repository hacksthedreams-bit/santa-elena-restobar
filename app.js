'use strict';
const GROUPS = [
  { id: 'compartir', name: 'Para compartir', cats: [57, 33, 29], photo: '426.webp' },
  { id: 'sandwiches', name: 'Sándwiches', cats: [26, 27, 28, 60], photo: '195.webp' },
  { id: 'platos', name: 'Platos', cats: [32], photo: 'ref-215.webp' },
  { id: 'postres', name: 'Postres', cats: [4], photo: 'ref-150.webp' },
  { id: 'cocteles', name: 'Cócteles', cats: [40, 36, 37, 38, 39, 41, 61, 42], photo: '235.webp' },
  { id: 'cervezas', name: 'Cervezas', cats: [51], photo: '413.webp' },
  { id: 'vinos', name: 'Vinos', cats: [44, 45], photo: '313.webp' },
  { id: 'destilados', name: 'Destilados', cats: [34, 46, 55], photo: '267.webp' },
  { id: 'sin-alcohol', name: 'Sin alcohol', cats: [58, 54], photo: '429.webp' },
];
const $ = (s) => document.querySelector(s),
  money = (n) =>
    new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      maximumFractionDigits: 0,
    }).format(n),
  norm = (s) =>
    String(s || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .trim(),
  esc = (s) =>
    String(s ?? '').replace(
      /[&<>"']/g,
      (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
    );
let menu,
  products = [],
  categories = new Map(),
  productMap = new Map(),
  serverState = { stock: [], featured: [472, 426, 362, 205], hours: null, images: {} },
  state = { category: 'all', sub: 'all', q: '' },
  saved = new Set(),
  compact = false,
  lastTrigger = null,
  detailPushed = false,
  detailId = null,
  toastTimer;
const dialog = $('#product-dialog'),
  catNames = {
    'Bebidas.': 'Bebidas',
    Botella: 'Botellas de destilados',
    Botellas: 'Vinos por botella',
    Copas: 'Vinos por copa',
    Cocteles: 'Cócteles',
  };
const catLabel = (id) => catNames[categories.get(id)?.name] || categories.get(id)?.name || '',
  groupFor = (p) => GROUPS.find((g) => g.cats.includes(p.productCategoryId));
function notify(s) {
  $('#toast').textContent = s;
  $('#toast').hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => ($('#toast').hidden = true), 3000);
}
function available(p) {
  const o = serverState.stock.find(
    (s) => s.id === p.id && (!s.expiresAt || Date.parse(s.expiresAt) > Date.now()),
  );
  return o ? o.state === 'available' : p.isAvailable;
}
function photo(p) {
  return serverState.images?.[p.id] || p.image;
}
function imageKind(p) {
  return serverState.images?.[p.id] ? 'uploaded' : p.imageKind;
}
const labels = {
  illustrative: 'Imagen ilustrativa',
  category: 'Referencia de categoría',
  manufacturer: 'Imagen de marca',
  ambient: 'Ambientación digital',
  reference: 'Presentación referencial',
};
function media(p, detail = false) {
  const kind = imageKind(p),
    src = photo(p),
    label = labels[kind];
  return `<div class="${detail ? 'detail-photo-wrapper' : 'product-media'}${p.brandBottle && kind === 'manufacturer' ? ' brand-bottle' : ''}"><img class="${detail ? 'detail-photo' : 'product-photo'}" src="${esc(src)}" alt="${esc(kind === 'category' ? 'Referencia visual de ' + groupFor(p).name : p.name)}" width="800" height="1000" ${detail ? '' : 'loading="lazy" decoding="async"'}>${label ? `<span class="image-label">${label}</span>` : ''}</div>`;
}
function productCard(p) {
  return `<article class="product${available(p) ? '' : ' unavailable'}" data-product="${p.id}">${media(p)}<div class="product-body"><button class="heart-button" data-save="${p.id}" aria-pressed="${saved.has(p.id)}" aria-label="${saved.has(p.id) ? 'Quitar de' : 'Guardar en'} mis favoritos: ${esc(p.name)}">${saved.has(p.id) ? '♥' : '♡'}</button><div class="product-meta"><span>${esc(catLabel(p.productCategoryId))}</span>${available(p) ? '' : '<span class="sold-out">Sin stock</span>'}</div><h4>${esc(p.name)}</h4><p>${esc(p.displayDescription)}</p><div class="product-bottom"><span class="product-price${p.price > 0 ? '' : ' unconfirmed'}">${p.price > 0 ? money(p.price) : 'Precio por confirmar'}</span><button class="detail-button" data-open="${p.id}" aria-label="Ver detalle de ${esc(p.name)}">Ver detalle <span aria-hidden="true">↗</span></button></div></div></article>`;
}
function matches(p) {
  return norm(state.q)
    .split(' ')
    .filter(Boolean)
    .every((t) => p.searchText.includes(t));
}
function visible() {
  return products.filter(
    (p) =>
      (state.category === 'all' ||
        (state.category === 'favoritos' && serverState.featured.includes(p.id)) ||
        (state.category === 'guardados' && saved.has(p.id)) ||
        groupFor(p)?.id === state.category) &&
      (state.sub === 'all' || String(p.productCategoryId) === state.sub) &&
      matches(p),
  );
}
function categoryTitle() {
  return state.category === 'all'
    ? 'Toda la carta'
    : state.category === 'favoritos'
      ? 'Favoritos de la casa'
      : state.category === 'guardados'
        ? 'Mis favoritos'
        : GROUPS.find((g) => g.id === state.category)?.name || 'Toda la carta';
}
function writeURL(push = false) {
  const u = new URL(location.href);
  for (const [k, v] of Object.entries({
    categoria: state.category === 'all' ? '' : state.category,
    tipo: state.sub === 'all' ? '' : state.sub,
    q: state.q,
  })) {
    if (v) u.searchParams.set(k, v);
    else u.searchParams.delete(k);
  }
  history[push ? 'pushState' : 'replaceState']({}, '', u);
}
function readURL() {
  const u = new URL(location.href),
    c = u.searchParams.get('categoria');
  state.category = ['favoritos', 'guardados', ...GROUPS.map((g) => g.id)].includes(c) ? c : 'all';
  state.q = (u.searchParams.get('q') || '').slice(0, 200);
  const t = u.searchParams.get('tipo');
  state.sub = t && GROUPS.find((g) => g.id === state.category)?.cats.includes(+t) ? t : 'all';
  $('#search').value = state.q;
}
// La versión estática (GitHub Pages) no tiene servidor: stock, horarios y fotos del panel no están activos.
const STATIC_MODE = !!document.querySelector('meta[name="se-static"]');
const reduceMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
function scrollResults() {
  const e = $('.results-bar');
  window.scrollTo({
    top: window.scrollY + e.getBoundingClientRect().top - $('.menu-tools').offsetHeight - 16,
    behavior: reduceMotion() ? 'instant' : 'smooth',
  });
}
function choose(c) {
  state.category = c;
  state.sub = 'all';
  writeURL(true);
  render();
  scrollResults();
}
function reset() {
  state = { category: 'all', sub: 'all', q: '' };
  $('#search').value = '';
  writeURL(true);
  render();
  scrollResults();
}
function categoryCount(g) {
  return g.id === 'all'
    ? products.length
    : g.id === 'favoritos'
      ? serverState.featured.length
      : g.id === 'guardados'
        ? saved.size
        : products.filter((p) => g.cats.includes(p.productCategoryId)).length;
}
function buildNav() {
  const all = [
    { id: 'all', name: 'Toda la carta', chip: 'Todo', photo: '472.webp' },
    { id: 'favoritos', name: 'Favoritos de la casa', chip: '★ Favoritos', photo: '426.webp' },
    ...GROUPS,
    { id: 'guardados', name: 'Mis favoritos', chip: '♥ Guardados', photo: '235.webp' },
  ];
  $('#category-nav').innerHTML = all
    .map((g) => {
      const count = categoryCount(g);
      return `<button data-category="${g.id}" aria-pressed="${state.category === g.id}"><img class="category-thumb" src="assets/${g.photo}" alt="" width="60" height="60" loading="lazy"><span class="category-caption">${g.name}<small>${count} ${g.id === 'guardados' ? 'guardados' : 'productos'}</small></span></button>`;
    })
    .join('');
  $('#category-chips').innerHTML = all
    .map(
      (g) =>
        `<button class="chip" data-category="${g.id}" aria-pressed="${state.category === g.id}" aria-label="${g.name}: ${categoryCount(g)} ${g.id === 'guardados' ? 'guardados' : 'productos'}">${g.chip || g.name}<small aria-hidden="true">${categoryCount(g)}</small></button>`,
    )
    .join('');
}
// Mantiene visible la categoría activa dentro de la barra fija horizontal.
let chipsPlaced = false;
function centerActiveChip(instant = false) {
  const bar = $('#category-chips'),
    chip = bar.querySelector('[aria-pressed="true"]');
  if (!chip || bar.scrollWidth <= bar.clientWidth) return;
  bar.scrollTo({
    left: chip.offsetLeft - (bar.clientWidth - chip.offsetWidth) / 2,
    // La primera colocación (carga de la página) es instantánea: un desplazamiento suave se cancela mientras carga.
    behavior: instant === true || !chipsPlaced || reduceMotion() ? 'auto' : 'smooth',
  });
  chipsPlaced = true;
}
function subNav() {
  const g = GROUPS.find((g) => g.id === state.category),
    b = $('#subcategories');
  const ids = g?.cats.filter((id) => products.some((p) => p.productCategoryId === id)) || [];
  b.hidden = ids.length < 2;
  b.innerHTML =
    ids.length > 1
      ? [
          `<button data-sub="all" aria-pressed="${state.sub === 'all'}">Ver todos</button>`,
          ...ids.map(
            (id) =>
              `<button data-sub="${id}" aria-pressed="${state.sub === String(id)}">${esc(catLabel(id))}</button>`,
          ),
        ].join('')
      : '';
}
function renderFeatured() {
  $('#featured-products').innerHTML = serverState.featured
    .map((id) => productMap.get(id))
    .filter(Boolean)
    .map(productCard)
    .join('');
  $('#favoritos').hidden = !serverState.featured.length;
}
function render() {
  if (!menu) return;
  const list = visible();
  document
    .querySelectorAll('[data-category]')
    .forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.category === state.category)));
  centerActiveChip();
  $('#clear-search').hidden = !state.q;
  $('#result-count').textContent =
    `${list.length} ${list.length === 1 ? 'producto' : 'productos'}${state.q ? (list.length === 1 ? ' encontrado' : ' encontrados') : ''}`;
  $('#selected-label').textContent = categoryTitle();
  subNav();
  const box = $('#menu-content');
  box.setAttribute('aria-busy', 'false');
  if (!list.length) {
    box.innerHTML = `<div class="empty"><h3>${state.category === 'guardados' ? 'TUS FAVORITOS, A UN TOQUE.' : 'NO ENCONTRAMOS COINCIDENCIAS'}</h3><p>${state.category === 'guardados' ? 'Toca el corazón de cualquier producto para guardarlo en este dispositivo.' : 'Prueba con otra palabra o vuelve a toda la carta.'}</p><button class="button primary" data-reset>Explorar toda la carta</button></div>`;
    return;
  }
  if (['favoritos', 'guardados'].includes(state.category)) {
    box.innerHTML = `<section class="product-group"><div class="group-heading"><h3>${categoryTitle()}<small>${list.length}</small></h3></div><div class="product-grid">${list.map(productCard).join('')}</div></section>`;
    return;
  }
  box.innerHTML = GROUPS.map((g) => {
    const ps = list.filter((p) => g.cats.includes(p.productCategoryId));
    return ps.length
      ? `<section class="product-group" aria-labelledby="group-${g.id}"><div class="group-heading"><h3 id="group-${g.id}">${g.name}<small>${ps.length}</small></h3></div><div class="product-grid">${ps.map(productCard).join('')}</div></section>`
      : '';
  }).join('');
}
function optionRule(g) {
  if (g.minQuantity > 0 && g.maxQuantity > 0)
    return `Elige entre ${g.minQuantity} y ${g.maxQuantity}`;
  if (g.minQuantity > 0) return `Elige al menos ${g.minQuantity}`;
  return g.maxQuantity > 0 ? `Puedes elegir hasta ${g.maxQuantity}` : '';
}
function optionItem({ op, price }) {
  const out = available(op) ? '' : '<em class="tag-out">Sin stock</em>';
  return price > 0
    ? `<li><span>${esc(op.name)}${out}</span><b>+${money(price)}<span class="sr-only"> de recargo</span></b></li>`
    : `<li><span>${esc(op.name)}${out}</span></li>`;
}
function optionGroups(p) {
  const groups = (p.productGroups || [])
    .map((g) => {
      const opts = g.productGroupProducts
        .map((o) => ({ op: productMap.get(o.productId), price: o.price }))
        .filter((o) => o.op);
      if (!opts.length) return '';
      const free = opts.filter((o) => !(o.price > 0)),
        paid = opts.filter((o) => o.price > 0),
        rule = optionRule(g);
      return `<div class="option-group"><div class="option-head"><strong>${esc(g.name)}</strong>${rule ? `<span class="option-rule">${rule}</span>` : ''}</div>${free.length ? `<p class="option-sub">Sin recargo</p><ul class="option-list">${free.map(optionItem).join('')}</ul>` : ''}${paid.length ? `<p class="option-sub">Con recargo</p><ul class="option-list has-price">${paid.map(optionItem).join('')}</ul>` : ''}</div>`;
    })
    .join('');
  return groups
    ? `<section class="options-info" aria-labelledby="options-title"><h3 id="options-title">Opciones y suplementos</h3>${groups}<p class="option-note">Confirma tu elección con el equipo al pedir.</p></section>`
    : '';
}
function detailHTML(p) {
  const kind = imageKind(p),
    disclosure =
      kind === 'illustrative'
        ? 'Imagen ilustrativa creada para esta demo. La presentación puede variar; los ingredientes y acompañamientos incluidos son únicamente los que confirma la descripción del restaurante.'
        : kind === 'ambient'
          ? 'Ambientación digital realizada a partir de una imagen de referencia del producto.'
          : kind === 'reference'
            ? 'Imagen de referencia de esta familia de preparación. La variedad, marca y presentación pueden variar.'
            : kind === 'category'
              ? 'La imagen ilustra la categoría y no representa la receta ni la porción exacta de este producto.'
              : kind === 'manufacturer'
                ? 'Imagen de referencia del producto. El servicio y la añada se confirman con el equipo.'
                : '';
  return `${media(p, true)}<div class="detail-inner"><div class="eyebrow">${esc(groupFor(p).name)} · ${esc(catLabel(p.productCategoryId))}</div><h2 id="detail-name">${esc(p.name)}</h2><div class="detail-pricebar"><span class="detail-price">${p.price > 0 ? money(p.price) : 'Precio por confirmar'}</span>${available(p) ? '' : '<span class="sold-out badge">Sin stock</span>'}</div><p class="description">${esc(p.displayDescription)}</p>${p.descriptionKind === 'name' ? '<p class="photo-disclosure">La carta no detalla una receta completa para este producto. Consulta ingredientes con el equipo.</p>' : ''}${p.descriptionSource ? `<p class="photo-disclosure">Nota del fabricante: <a href="${esc(p.descriptionSource)}" target="_blank" rel="noopener noreferrer">ver referencia ↗</a></p>` : ''}${optionGroups(p)}${disclosure ? `<aside class="image-note"><strong>Sobre la imagen</strong><p>${disclosure}</p></aside>` : ''}<p class="detail-meta">${p.price > 0 ? 'Precio publicado en pesos chilenos.' : 'La fuente registra $0. Consulta el precio antes de pedir.'}</p><button class="favorite-in-detail" data-save="${p.id}" aria-pressed="${saved.has(p.id)}">${saved.has(p.id) ? '♥ Guardado en' : '♡ Guardar en'} mis favoritos</button><div class="detail-sticky"><a class="button primary" href="${menu.whatsapp}" target="_blank" rel="noopener noreferrer">Consultar por WhatsApp ↗</a></div></div>`;
}
function showProduct(id, push = true) {
  const p = productMap.get(+id);
  if (!p) return;
  lastTrigger = document.activeElement;
  detailId = p.id;
  $('#detail-content').innerHTML = detailHTML(p);
  if (!dialog.open) dialog.showModal();
  dialog.scrollTop = 0;
  $('.dialog-close').focus();
  if (push) {
    const u = new URL(location.href);
    u.searchParams.set('producto', p.id);
    history.pushState({}, '', u);
    detailPushed = true;
  }
}
function closeProduct() {
  if (!dialog.open) return;
  dialog.close();
  detailId = null;
  if (detailPushed) {
    detailPushed = false;
    history.back();
  } else {
    const u = new URL(location.href);
    u.searchParams.delete('producto');
    history.replaceState({}, '', u);
  }
  if (lastTrigger?.isConnected) lastTrigger.focus({ preventScroll: true });
}
function toggleSave(id) {
  const focusRoot = $('#featured-products').contains(document.activeElement)
    ? '#featured-products'
    : '#menu-content';
  id = +id;
  if (saved.has(id)) saved.delete(id);
  else saved.add(id);
  try {
    localStorage.setItem('se-favorites', JSON.stringify([...saved]));
  } catch {}
  const y = window.scrollY;
  buildNav();
  render();
  renderFeatured();
  window.scrollTo({ top: y, behavior: 'instant' });
  if (dialog.open && detailId === id) {
    const b = $('#detail-content [data-save]');
    b.setAttribute('aria-pressed', String(saved.has(id)));
    b.textContent = saved.has(id) ? '♥ Guardado en mis favoritos' : '♡ Guardar en mis favoritos';
  }
  if (!dialog.open) $(focusRoot + ' [data-save="' + id + '"]')?.focus({ preventScroll: true });
  notify(saved.has(id) ? 'Guardado en tus favoritos' : 'Producto eliminado de tus favoritos');
}
function prefs() {
  const big = document.body.classList.contains('large-text');
  $('#text-size').setAttribute('aria-pressed', String(big));
  $('#text-size').setAttribute(
    'aria-label',
    big ? 'Volver al tamaño de texto normal' : 'Activar texto más grande',
  );
  $('#list-toggle').setAttribute('aria-pressed', String(compact));
  $('#list-toggle').setAttribute(
    'aria-label',
    compact ? 'Activar vista con fotografías grandes' : 'Activar vista compacta',
  );
  $('#list-toggle span').textContent = compact ? 'Vista con fotos' : 'Vista compacta';
  $('#menu-content').classList.toggle('compact', compact);
}
const DAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
function nowParts(date = new Date()) {
  const f = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Santiago',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });
  const p = Object.fromEntries(f.formatToParts(date).map((x) => [x.type, x.value]));
  return {
    day: new Date(Date.UTC(+p.year, +p.month - 1, +p.day)).getUTCDay(),
    minute: +p.hour * 60 + +p.minute,
  };
}
const mins = (s) => +s.split(':')[0] * 60 + +s.split(':')[1];
function opening() {
  const hours = serverState.hours;
  if (!hours) return { text: 'Horario de atención por confirmar', open: false };
  const { day, minute } = nowParts(),
    today = hours[day],
    prev = hours[(day + 6) % 7];
  if (prev && !prev.closed && mins(prev.close) < mins(prev.open) && minute < mins(prev.close))
    return { text: 'Abierto · Cerramos a las ' + prev.close, open: true };
  if (today && !today.closed) {
    const a = mins(today.open),
      b = mins(today.close);
    if (minute >= a && (b < a || minute < b))
      return { text: 'Abierto · Cerramos a las ' + today.close, open: true };
    if (minute < a) return { text: 'Hoy abrimos a las ' + today.open, open: false };
  }
  for (let n = 1; n <= 7; n++) {
    const h = hours[(day + n) % 7];
    if (h && !h.closed)
      return { text: 'Próxima apertura: ' + DAYS[(day + n) % 7] + ' ' + h.open, open: false };
  }
  return { text: 'Consulta la próxima apertura con el equipo', open: false };
}
function clock() {
  const n = new Date();
  $('#live-clock').textContent = new Intl.DateTimeFormat('es-CL', {
    timeZone: 'America/Santiago',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).format(n);
  $('#live-clock').dateTime = n.toISOString();
  $('#live-date').textContent = new Intl.DateTimeFormat('es-CL', {
    timeZone: 'America/Santiago',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(n);
  const s = opening();
  $('#opening-status').textContent = s.text;
  $('#opening-status').classList.toggle('is-open', s.open);
}
const HOURS_PENDING = $('#hours-list').innerHTML;
let locationShown = null;
function hours() {
  if (serverState.hours) {
    const { day } = nowParts();
    $('#hours-list').innerHTML = [1, 2, 3, 4, 5, 6, 0]
      .map(
        (d) =>
          `<div class="day-row${d === day ? ' today' : ''}"><span>${DAYS[d]}</span><strong>${serverState.hours[d].closed ? 'Cerrado' : serverState.hours[d].open + ' — ' + serverState.hours[d].close}</strong></div>`,
      )
      .join('');
  } else {
    $('#hours-list').innerHTML = HOURS_PENDING;
  }
  clock();
  if (serverState.locationPhoto && locationShown !== serverState.locationVersion) {
    locationShown = serverState.locationVersion;
    $('#location-visual').innerHTML =
      '<img src="media/location?v=' +
      encodeURIComponent(serverState.locationVersion || '1') +
      '" alt="Imagen del local proporcionada por administración" width="900" height="600" loading="lazy"><span>Santa Elena · Ubicación</span>';
  }
}
async function refreshState() {
  try {
    const r = await fetch('api/state', { cache: 'no-store' });
    if (!r.ok) return;
    const next = await r.json(),
      changed = JSON.stringify(next) !== JSON.stringify(serverState);
    serverState = next;
    if (!menu) return;
    // Sin cambios no se reconstruye la carta: así no se pierde el foco del teclado.
    if (!changed) return hours();
    const y = window.scrollY;
    buildNav();
    render();
    renderFeatured();
    hours();
    window.scrollTo({ top: y, behavior: 'instant' });
    if (dialog.open && detailId) {
      const p = productMap.get(detailId),
        stock = $('#detail-content .sold-out');
      if (!available(p) && !stock)
        $('#detail-content .detail-pricebar').insertAdjacentHTML(
          'beforeend',
          '<span class="sold-out badge">Sin stock</span>',
        );
      if (available(p) && stock) stock.remove();
    }
  } catch {}
}
let searchTimer;
$('#search').addEventListener('input', (e) => {
  state.q = e.target.value.slice(0, 200);
  $('#clear-search').hidden = !state.q;
  writeURL();
  // Espera una pausa al escribir: reconstruir 225 fichas por tecla es lento en móviles modestos.
  clearTimeout(searchTimer);
  searchTimer = setTimeout(render, 120);
});
$('#clear-search').onclick = () => {
  clearTimeout(searchTimer);
  state.q = '';
  $('#search').value = '';
  writeURL();
  render();
  $('#search').focus();
};
$('#reset').onclick = () => {
  clearTimeout(searchTimer);
  reset();
};
const chooseCategory = (e) => {
  const b = e.target.closest('[data-category]');
  if (b) choose(b.dataset.category);
};
$('#category-nav').onclick = chooseCategory;
$('#category-chips').onclick = chooseCategory;
// Flechas, Inicio y Fin recorren las categorías de la barra fija.
$('#category-chips').addEventListener('keydown', (e) => {
  const chips = [...e.currentTarget.querySelectorAll('button')],
    i = chips.indexOf(document.activeElement),
    to = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: chips.length - 1 }[e.key];
  if (i < 0 || to === undefined) return;
  e.preventDefault();
  chips[(to + chips.length) % chips.length].focus();
});
$('#subcategories').onclick = (e) => {
  const b = e.target.closest('[data-sub]');
  if (b) {
    state.sub = b.dataset.sub;
    writeURL(true);
    render();
    scrollResults();
  }
};
document.addEventListener('click', (e) => {
  const save = e.target.closest('[data-save]');
  if (save) {
    e.preventDefault();
    toggleSave(save.dataset.save);
    return;
  }
  const open = e.target.closest('[data-open],[data-hero-product]');
  if (open) {
    e.preventDefault();
    showProduct(open.dataset.open || open.dataset.heroProduct);
  }
  if (e.target.closest('[data-reset]')) reset();
  if (e.target.closest('[data-go-featured]')) {
    e.preventDefault();
    choose('favoritos');
  }
  if (e.target.closest('.top-nav a')) {
    $('#top-nav').classList.remove('is-open');
    $('#nav-toggle').setAttribute('aria-expanded', 'false');
  }
});
$('.dialog-close').onclick = closeProduct;
dialog.addEventListener('cancel', (e) => {
  e.preventDefault();
  closeProduct();
});
dialog.addEventListener('click', (e) => {
  if (e.target === dialog) {
    const r = dialog.getBoundingClientRect();
    if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom)
      closeProduct();
  }
});
$('#list-toggle').onclick = () => {
  compact = !compact;
  try {
    localStorage.setItem('se-compact', compact ? '1' : '0');
  } catch {}
  prefs();
};
$('#text-size').onclick = () => {
  document.body.classList.toggle('large-text');
  try {
    localStorage.setItem(
      'se-large-text',
      document.body.classList.contains('large-text') ? '1' : '0',
    );
  } catch {}
  prefs();
  notify(
    document.body.classList.contains('large-text')
      ? 'Texto más grande activado'
      : 'Tamaño de texto normal',
  );
};
$('#nav-toggle').onclick = () => {
  const o = $('#top-nav').classList.toggle('is-open');
  $('#nav-toggle').setAttribute('aria-expanded', String(o));
};
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && $('#top-nav').classList.contains('is-open')) {
    $('#top-nav').classList.remove('is-open');
    $('#nav-toggle').setAttribute('aria-expanded', 'false');
    $('#nav-toggle').focus();
  }
});
$('#copy-address').onclick = async () => {
  try {
    await navigator.clipboard.writeText($('#address-text').textContent);
    notify('Dirección copiada');
  } catch {
    notify('No se pudo copiar. Selecciona la dirección y cópiala manualmente.');
  }
};
$('#mobile-search').onclick = () => {
  $('#search').scrollIntoView({ block: 'center', behavior: 'instant' });
  $('#search').focus({ preventScroll: true });
};
window.addEventListener('popstate', () => {
  if (!menu) return;
  readURL();
  render();
  const id = new URL(location.href).searchParams.get('producto');
  if (id) showProduct(id, false);
  else if (dialog.open) {
    dialog.close();
    detailId = null;
    detailPushed = false;
  }
});
try {
  compact = localStorage.getItem('se-compact') === '1';
  document.body.classList.toggle('large-text', localStorage.getItem('se-large-text') === '1');
  const f = JSON.parse(localStorage.getItem('se-favorites') || '[]');
  if (Array.isArray(f)) saved = new Set(f.filter(Number.isInteger));
} catch {}
prefs();
clock();
setInterval(clock, 1000);
(async () => {
  try {
    const [mr, sr, session] = await Promise.all([
      fetch('menu.json', { cache: 'no-store' }),
      STATIC_MODE ? null : fetch('api/state'),
      STATIC_MODE ? null : fetch('api/session'),
    ]);
    if (!mr.ok) throw Error('menu');
    menu = await mr.json();
    if (sr?.ok) serverState = await sr.json();
    if (session?.ok && (await session.json()).canManage) $('#admin-link').hidden = false;
    categories = new Map(menu.categories.map((c) => [c.id, c]));
    productMap = new Map(menu.products.map((p) => [p.id, p]));
    products = menu.products
      .map((p) => ({
        ...p,
        searchText: norm(
          [
            p.name,
            p.name.replace(/souvignon/gi, 'Sauvignon'),
            p.displayDescription,
            catLabel(p.productCategoryId),
            groupFor(p)?.name,
          ].join(' '),
        ),
      }))
      .sort((a, b) => {
        const ga = groupFor(a),
          gb = groupFor(b);
        return (
          GROUPS.indexOf(ga) - GROUPS.indexOf(gb) ||
          ga.cats.indexOf(a.productCategoryId) - gb.cats.indexOf(b.productCategoryId) ||
          (a.position || 0) - (b.position || 0)
        );
      });
    readURL();
    buildNav();
    render();
    renderFeatured();
    hours();
    // Al cargar la tipografía cambian los anchos: se vuelve a centrar la categoría activa.
    document.fonts?.ready.then(() => centerActiveChip(true));
    const hp = productMap.get(472);
    if (hp) {
      $('#hero-photo').src = photo(hp);
      $('#hero-photo').alt =
        'Tabla La Segunda · ' +
        (imageKind(hp) === 'published'
          ? 'Imagen de la carta'
          : 'Ambientación digital de la imagen de carta');
      // La etiqueta visible identifica imágenes ilustrativas o ambientadas, igual que en las fichas.
      const heroLabel = labels[imageKind(hp)];
      $('#hero-label').textContent = heroLabel || '';
      $('#hero-label').hidden = !heroLabel;
      $('#hero-price').textContent = hp.price > 0 ? money(hp.price) : 'Precio por confirmar';
      $('#hero-price').hidden = false;
    }
    const id = new URL(location.href).searchParams.get('producto');
    if (id) showProduct(id, false);
    if (!reduceMotion() && 'IntersectionObserver' in window) {
      document.body.classList.add('motion-ready');
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (e.isIntersecting) {
              e.target.classList.add('is-visible');
              io.unobserve(e.target);
            }
          });
        },
        { threshold: 0.08 },
      );
      document.querySelectorAll('.reveal').forEach((e) => io.observe(e));
    }
    if (!STATIC_MODE) {
      setInterval(() => {
        if (!document.hidden) refreshState();
      }, 30000);
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden) refreshState();
      });
    }
  } catch {
    $('#result-count').textContent = 'No se pudo cargar la carta';
    $('#menu-content').setAttribute('aria-busy', 'false');
    $('#menu-content').innerHTML =
      '<div class="empty"><h3>NO SE PUDO CARGAR LA CARTA</h3><p>Intenta recargar o consulta la carta de origen.</p><a class="button primary" href="https://menu.fu.do/boragourmet/qr-menu" target="_blank" rel="noopener noreferrer">Abrir carta de origen ↗</a></div>';
  }
})();
