// Retoques de presentación de la carta: redacción comercial + imágenes de botellas integradas.
// 1) Redacción para los productos cuya carta no trae descripción (descriptionKind "name").
// Regla de oro: no se inventan recetas, ingredientes, porciones ni cifras. Solo se usan datos que ya
// dicen el nombre del producto (sabor, marca, formato) más lenguaje de ambiente.
// Es idempotente: se puede ejecutar varias veces y siempre produce el mismo texto.
// Uso: node scripts/copy.mjs   (después de scripts/enrich.mjs, si alguna vez se vuelve a ejecutar)
import fs from 'node:fs/promises';

const menu = JSON.parse(await fs.readFile('public/menu.json', 'utf8'));

// ── Textos escritos a mano, por id ─────────────────────────────────────────
const manual = {
  // Bebidas
  328: 'Burbujas y un toque amargo: la compañera de tu gin tonic o un trago fresco para tomar sola.',
  329: 'Agua mineral con gas, bien helada, para acompañar cada plato de la mesa.',
  330: 'Agua mineral sin gas: simple, fresca y siempre bienvenida en la mesa.',
  279: 'El clásico de siempre, bien helado, en lata de 350 ml.',
  280: 'La versión Zero del clásico, bien helada y en lata de 350 ml.',
  283: 'Un clásico burbujeante y bien frío, en lata de 350 ml.',
  326: 'Burbujeante y con un toque picante: refrescante sola o para combinar.',
  327: 'La versión cero de este clásico burbujeante, fresca y liviana.',
  323: 'Energía en lata, bien fría, para alargar la noche.',
  325: 'Energía con un toque frutal de sandía, helada y lista para destapar.',
  324: 'Frutal, helada y con energía de sobra: la versión tropical.',
  282: 'Cítrica, refrescante y sin azúcar, en lata de 350 ml.',
  281: 'Refrescante y burbujeante, siempre bien helada. Lata de 350 ml.',
  // Cervezas
  353: 'El punto de partida para una chelada bien fría, armada a tu gusto.',
  352: 'La base para una michelada con carácter, para quien le gusta la cerveza con más sabor.',
  332: 'La rubia mexicana de siempre, helada y lista para destapar. Botella de 330 cc.',
  331: 'Lager holandesa, fresca y equilibrada, en botella de 330 ml.',
  464: 'Una cerveza chilena de Kunstmann con identidad propia.',
  277: 'Shop de cerveza artesanal Calafate, para acompañar la conversación.',
  413: 'Un shop de Stella, bien frío y listo para brindar.',
  // Vinos por copa y botella
  339: 'Copa de Diablo Black, un Cabernet Sauvignon para quienes disfrutan los tintos con presencia.',
  342: 'Copa de Diablo Crystal, un blanco fresco para empezar la noche.',
  452: 'Diablo Dark Red en copa: un tinto intenso para acompañar tu mesa.',
  341: 'Copa de Diablo Deep Carmenere, el tinto de la cepa emblemática de Chile.',
  340: 'Diablo Velvet Merlot en copa, un tinto suave para brindar sin apuro.',
  444: 'Botella de Diablo Dark Red para compartir en la mesa. Consulta la añada disponible.',
  290: 'Botella de Pisco Mistral Nobel con un giro de manzana, para compartir en grande.',
  474: 'Pisco Mistral Nobel Cristalino en botella: así se arma la mesa grande.',
  // Daikiri
  242: 'Frambuesa en un daikiri frutal e intenso, de color irresistible.',
  244: 'Daikiri de mango: tropical, dorado y pensado para quedarse en la mesa un rato largo.',
  243: 'Maracuyá en su versión más vibrante: un daikiri fresco con un toque ácido.',
  // Sour
  483: 'Un sour distinto, con chardonnay: suave, fresco y fácil de tomar.',
  473: 'El clásico chileno en su versión Catedral, para brindar a la chilena.',
  231: 'Whisky sour con Etiqueta Negra: intenso, cítrico y con mucho carácter.',
  // Shots
  348: 'Un shot de Jägermeister para brindar a lo grande.',
  349: 'Shot de Olmeca Reserva, tequila para saborear en un solo trago.',
  346: 'Tequila nacional en shot: simple y directo para la ronda.',
  347: 'Shot de Olmeca Silver, el tequila blanco para brindar con ganas.',
  // Sin alcohol
  333: 'El sabor de Corona sin alcohol, bien fría. Botella de 330 cc.',
  432: 'Jugo de chirimoya, dulce y cremoso para refrescar el paladar.',
  431: 'Jugo de frambuesa, de color intenso y sabor fresco.',
  429: 'Jugo de mango, tropical y lleno de sabor.',
  430: 'Jugo de maracuyá: ácido, aromático y muy refrescante.',
  357: 'El mojito de siempre, pero sin alcohol: fresco y para todos.',
  389: 'Un mojito con Corona 0 alcohol: una mezcla fresca y distinta.',
  358: 'Mojitos sin alcohol en distintos sabores. Pregúntanos por las variedades.',
  // Para picar y papas
  475: 'Pastel de jaiba, un clásico de la cocina chilena para compartir como entrada.',
  225: 'Tres empanadas de queso para compartir, o para quedártelas todas.',
  224: 'Tres empanadas de camarón y queso: el sabor del mar con el abrazo del queso.',
  222: 'Tres empanadas de champiñón y queso, para quienes prefieren algo sin carne.',
  223: 'Tres empanadas de mechada y queso, una dupla que nunca falla.',
  380: 'Papas fritas individuales, crujientes y listas para acompañar tu sándwich.',
  381: 'Papas fritas XL: la porción grande para compartir en la mesa.',
  354: 'Suprema XL, hecha para compartir y pedir junto a una cerveza helada.',
  // Postres
  149: 'Cremoso y reconfortante: el arroz con leche de siempre para cerrar la mesa.',
  150: 'Leche asada, el postre chileno de toda la vida, para cerrar con dulzura.',
  187: 'Mousse de frutilla: suave, fresco y con el dulzor de la fruta.',
  184: 'Mousse de maracuyá: un final fresco con un toque ácido.',
  // Cócteles de la barra
  400: 'La caipirinha, el clásico brasileño que sabe a verano.',
  485: 'Prima de la caipirinha, con vodka: fresca, cítrica y directa.',
  405: 'Clavo Oxidado con Etiqueta Negra: un trago de sobremesa para saborear sin apuro.',
  404: 'Clavo Oxidado con Etiqueta Roja, la forma más cercana de probar este clásico.',
  403: 'Clavo Oxidado con Jack Daniel’s: intenso, ambarino y de los que se toman de a poco.',
  375: 'Negroni: amargo, elegante y de los que se piden con convicción.',
  374: 'Ruso Blanco, de aire cremoso y suave, perfecto para cerrar la noche.',
  // Moscow Mule
  476: 'El clásico Moscow Mule: fresco, burbujeante y con carácter.',
  482: 'Jack Mule N°7: el mule con Jack Daniel’s, para los amantes del whisky.',
  479: 'Moscow Mule con frambuesa: frutal, burbujeante y muy fresco.',
  478: 'Moscow Mule con mango: tropical, burbujeante y fácil de tomar.',
  477: 'Moscow Mule con maracuyá: ácido, aromático y con mucha chispa.',
  481: 'Scotch Mule con whisky Etiqueta Negra, para quienes buscan más cuerpo.',
  480: 'Scotch Mule con Etiqueta Roja: vivo, burbujeante y con espíritu de whisky.',
  // Mojitos
  248: 'Mojito Corona: la frescura de un mojito con una Corona bien helada.',
  249: 'Mojito de frambuesa: fresco, frutal y de color intenso.',
  489: 'Mojito Jägermeister, una mezcla atrevida para quienes quieren probar algo nuevo.',
  251: 'Mojito de mango: tropical y refrescante, ideal para una tarde larga.',
  250: 'Mojito de maracuyá, con ese toque ácido y aromático que se agradece.',
  236: 'Mojito Polaco: una versión distinta del clásico, para pedir con curiosidad.',
  237: 'Mojito Polaco con frambuesa, frutal y fácil de tomar.',
  238: 'Mojito Polaco con maracuyá, fresco y con un toque ácido.',
  // Margaritas
  240: 'Margarita Blue con tequila nacional: azul intenso y mucha frescura.',
  308: 'Margarita Blue con tequila Olmeca, para subir el nivel del brindis.',
  241: 'Margarita de frambuesa con tequila nacional: frutal, helada y brillante.',
  450: 'Margarita de mango con tequila nacional: tropical, dorada y siempre alegre.',
  449: 'Margarita de maracuyá con tequila nacional: ácida, aromática y refrescante.',
  239: 'La margarita clásica con tequila nacional: simple, fresca y cítrica.',
  307: 'La margarita clásica con tequila Olmeca, para elevar el brindis.',
  // Otros
  488: 'Campari, amargo y vibrante, de color inconfundible.',
  437: 'Fernet Branca con cola: el amargo que gusta a muchos, largo y refrescante.',
  304: 'Jägermeister para quienes disfrutan un licor de hierbas con carácter.',
  435: 'Vodka Stolichnaya: limpio y directo, para combinar a tu manera.',
  468: 'Baileys en formato corto: cremoso y dulce, para una sobremesa tranquila.',
  436: 'Frangelico en formato corto: dulce y con aire de sobremesa.',
};

// ── Sándwiches ─────────────────────────────────────────────────────────────
const style = [
  [/chacarero/i, ['Versión chacarero, el sabor chileno de toda la vida.', 'Chacarero a la manera de la casa: un clásico que nunca falla.']],
  [/tomate mayo/i, ['Tomate y mayo, la dupla clásica que no necesita presentación.', 'Simple y bien armado, con el tomate y la mayo de siempre.']],
  [/brasil/i, ['Estilo Brasil: un sándwich generoso para saborear sin apuro.', 'Al estilo Brasil, pensado para quien llega con hambre.']],
  [/italian/i, ['Italiano, el clásico chileno en su versión de la casa.', 'Un italiano de los que se piden sin pensarlo.']],
  [/queso/i, ['Con queso, como corresponde: simple, sabroso y reconfortante.', 'Queso y sándwich, una combinación que nunca falla.']],
];
const protein = [
  [/^ave/i, ['Para acompañar con una bebida bien fría.', 'Ideal para pedir junto a unas papas y una buena conversación.']],
  [/^churrasco/i, ['Para los que prefieren la carne como protagonista.', 'Churrasco de los que se piden con ganas.']],
  [/^mechada/i, ['Para los que aman la mechada, sin vueltas.', 'Mechada de las que se piden de nuevo.']],
  [/^vienesa/i, ['Un clásico de barrio, tal como se come en Chile.']],
];
const sandwichCats = new Set([26, 27, 28, 60]);

// ── Familias de destilados ─────────────────────────────────────────────────
const families = [
  { re: /pisco/i, lines: ['El pisco que Chile conoce, para brindar a la chilena.', 'Pisco para quienes disfrutan lo nuestro, de los que no pasan de moda.', 'Un pisco para compartir la mesa y brindar entre amigos.', 'Pisco de siempre, con el espíritu de una buena junta.'] },
  { re: /ron|havan/i, lines: ['Ron añejo de aire caribeño, ideal para una noche larga.', 'Ron con carácter, para saborear con calma.', 'Dulzor y profundidad en un ron para brindar sin apuro.'] },
  { re: /whisk|chivas|jack|jw\b/i, lines: ['Whisky para quienes disfrutan los destilados con cuerpo.', 'Un whisky con personalidad, para tomar sin apuro.', 'Intenso y con carácter, para los que prefieren el whisky.', 'Whisky de la barra, servido para una buena conversación.'] },
  { re: /gin/i, lines: ['Gin fresco y aromático para empezar la noche.'] },
  { re: /./, lines: ['Un trago de la barra para brindar con ganas.'] },
];
const modifiers = [
  [/nobel/i, 'Línea Nobel, para quienes buscan un pisco más redondo.'],
  [/barrica tostada/i, 'Con el sello de la barrica tostada.'],
  [/cristalino/i, 'Cristalino: transparente y limpio al paladar.'],
  [/pisco.*manzana|manzana.*pisco/i, 'Con un giro de manzana.'],
  [/jack.*manzana|manzana.*jack/i, 'Con el toque fresco de la manzana.'],
  [/miel/i, 'Con su toque dulce de miel.'],
  [/blackberry/i, 'Con un guiño a la mora.'],
  [/double black/i, 'Double Black, para quienes buscan más intensidad.'],
  [/etiqueta negra/i, 'Etiqueta Negra, para quienes prefieren más carácter.'],
  [/etiqueta roja/i, 'Etiqueta Roja, viva y fácil de combinar.'],
  [/n[°º]?\s?7/i, 'El clásico N°7 de Jack Daniel’s.'],
  [/chivas/i, 'Chivas Regal 12 Años, un clásico de las barras.'],
  [/reserva/i, 'En su versión Reserva.'],
  [/especial/i, 'En su versión Añejo Especial.'],
  [/alto del carmen/i, 'Alto del Carmen, un nombre clásico del pisco nacional.'],
  [/fundo los nichos/i, 'De Fundo Los Nichos.'],
  [/\b35/i, 'A 35°, más ligero de beber.'],
  [/\b40/i, 'A 40°.'],
  [/barcel/i, 'Barceló Añejo, un clásico dominicano.'],
  [/havan/i, 'Havana Club, ron cubano de siempre.'],
];

const hash = (n) => (n * 2654435761) >>> 0;
const pick = (arr, id) => arr[hash(id) % arr.length];

function destilado(p) {
  const n = p.name.replace(/\s+/g, ' ').trim();
  const fam = families.find((f) => f.re.test(n));
  const mods = modifiers.filter(([re]) => re.test(n)).slice(0, 2).map(([, t]) => t);
  const isCorto = /^corto/i.test(n);
  const isCombinado = /^combinado/i.test(n);
  const format = isCorto
    ? pick(['Formato corto: directo y para tomar con calma.', 'En formato corto, para saborear de a poco.', 'Una medida corta, para brindar sin apuro.'], p.id + 3)
    : isCombinado
      ? pick(['Servido como combinado, listo para compartir la mesa.', 'En combinado: un trago largo para alargar la noche.', 'Armado como combinado, fresco y fácil de tomar.'], p.id + 3)
      : '';
  return [pick(fam.lines, p.id), ...mods, format].filter(Boolean).join(' ');
}

// ── Gin ────────────────────────────────────────────────────────────────────
function gin(p) {
  const n = p.name;
  const brand = /hendri|hendic/i.test(n)
    ? ['Con Hendrick’s, el gin escocés de carácter distintivo.', 'Hendrick’s, para quienes buscan un gin diferente.']
    : /beefeater/i.test(n)
      ? ['Con Beefeater, el clásico gin londinense.', 'Beefeater, el gin de siempre en versión de barra.']
      : ['Con gin nacional: simple y fácil de tomar.', 'Gin nacional, sin complicaciones y bien servido.'];
  const drink = /acai/i.test(n)
    ? ['Frutos rojos y un color imposible de ignorar.', 'Un gin frutal e intenso, de color profundo.']
    : /tom collins/i.test(n)
      ? ['Largo, cítrico y burbujeante, para tomar sin prisa.', 'Un Tom Collins fresco y de buen aire estival.']
      : /tonic/i.test(n)
        ? ['El clásico: burbujeante, seco y fresco.', 'Gin tonic de los que nunca fallan.']
        : /tropical/i.test(n)
          ? ['Frutal y tropical, con aire de vacaciones.', 'Un gin con alma tropical, fresco y de buen color.']
          : ['Una mezcla larga y refrescante para pedir una segunda vuelta.', 'Largo, fresco y fácil de disfrutar.'];
  const i = hash(p.id) % 2;
  return `${drink[i]} ${brand[(i + (hash(p.id + 7) % 2)) % 2]}`;
}

// ── Ejecución ──────────────────────────────────────────────────────────────
let changed = 0;
for (const p of menu.products) {
  if (p.descriptionKind !== 'name') continue;
  let text = manual[p.id];
  if (!text && sandwichCats.has(p.productCategoryId)) {
    const s = style.find(([re]) => re.test(p.name));
    const t = protein.find(([re]) => re.test(p.name));
    if (s && t) text = `${pick(s[1], p.id)} ${pick(t[1], p.id + 5)}`;
  }
  if (!text && p.productCategoryId === 37) text = gin(p);
  if (!text && [34, 55].includes(p.productCategoryId)) text = destilado(p);
  if (!text) {
    console.warn('Sin texto nuevo para', p.id, p.name);
    continue;
  }
  if (p.displayDescription !== text) changed++;
  p.displayDescription = text;
}

// ── Botellas de marca sobre escenario de barra ─────────────────────────────
// Imágenes generadas con scripts/stage-bottles.py a partir de la imagen que ya usaba cada producto.
// El tipo de imagen no cambia (siguen identificadas como "Imagen de marca" o publicada).
const staged = {
  317: 'stage-crystal', 342: 'stage-crystal', 440: 'stage-purple',
  335: 'stage-brut', 336: 'stage-brut', 320: 'stage-gold', 290: 'stage-mistral-manzana',
};
for (const p of menu.products) {
  const file = staged[p.id];
  if (!file) continue;
  p.image = `assets/${file}.webp`;
  delete p.brandBottle;
}

// Revisión: textos repetidos entre productos distintos.
const seen = new Map();
for (const p of menu.products) {
  if (p.descriptionKind !== 'name') continue;
  (seen.get(p.displayDescription) || seen.set(p.displayDescription, []).get(p.displayDescription)).push(p.id);
}
const dups = [...seen].filter(([, ids]) => ids.length > 1);
await fs.writeFile('public/menu.json', JSON.stringify(menu));
console.log(`Descripciones actualizadas: ${changed}. Textos repetidos: ${dups.length}`);
for (const [t, ids] of dups) console.log(' ·', ids.join(','), '→', t);
