/**
 * Microservicio propio Naruto (proceso aparte, puerto 3002).
 * Arquitectura espejo de Pokemon: Front --GET /consultaNaruto?query=sasuke--> Node
 * --GET dattebayo-api.onrender.com--> nube. Respuesta JSON curada de vuelta al Front.
 */
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3002;
const NARUTO_BASE = 'https://dattebayo-api.onrender.com/characters';

app.use(cors());
app.use(express.json());

const first = (v) => (Array.isArray(v) ? v[0] : v) || null;

// Catálogo de IDs para anterior/siguiente (los IDs Dattebayo no son secuenciales:
// hay huecos de hasta 70). Se carga una vez y se cachea en memoria.
let catalogIds = null;
let catalogPromise = null;

async function getCatalog() {
  if (catalogIds) return catalogIds;
  if (!catalogPromise) {
    catalogPromise = (async () => {
      const firstPage = await (await fetch(`${NARUTO_BASE}?page=1&limit=1`)).json();
      const total = firstPage.total || 1431;
      const perPage = 100;
      const pages = Math.ceil(total / perPage);
      const ids = [];
      for (let i = 0; i < pages; i += 4) { // lotes de 4 para no saturar el tier gratis
        const batch = [];
        for (let p = i + 1; p <= Math.min(i + 4, pages); p++) {
          batch.push(fetch(`${NARUTO_BASE}?page=${p}&limit=${perPage}`).then((r) => r.json()));
        }
        const results = await Promise.all(batch);
        for (const r of results) for (const c of r.characters || []) ids.push(c.id);
      }
      catalogIds = [...new Set(ids)].sort((a, b) => a - b);
      return catalogIds;
    })().catch((e) => { catalogPromise = null; throw e; });
  }
  return catalogPromise;
}

function neighbors(id) {
  if (!catalogIds) return { prevId: null, nextId: null };
  const i = catalogIds.indexOf(id);
  if (i < 0) return { prevId: null, nextId: null };
  return { prevId: i > 0 ? catalogIds[i - 1] : null, nextId: i < catalogIds.length - 1 ? catalogIds[i + 1] : null };
}

function toCurated(c) {
  const personal = c.personal || {};
  const debut = c.debut || {};
  const aff = personal.affiliation;
  const villages = Array.isArray(aff) ? aff : aff ? [aff] : [];
  const clan = personal.clan || null;
  const jutsus = Array.isArray(c.jutsu) ? c.jutsu : [];
  const images = Array.isArray(c.images) ? c.images : [];
  return {
    id: c.id,
    name: c.name,
    images,
    // Cualidades específicas de la galería: clan + aldea + jutsu insignia.
    clan,
    villages,
    signatureJutsu: first(jutsus),
    // Datos de la tab secundaria.
    sex: personal.sex || null,
    age: personal.age || null,
    height: first(personal.height),
    weight: first(personal.weight),
    debutManga: debut.manga || null,
    debutAnime: debut.anime || null,
    natureTypes: Array.isArray(c.natureType) ? c.natureType : [],
    jutsus,
    family: c.family && typeof c.family === 'object' ? c.family : {},
    rank: c.rank && typeof c.rank === 'object' ? c.rank : {},
    tools: Array.isArray(c.tools) ? c.tools.slice(0, 20) : [],
  };
}

async function fetchById(id) {
  const res = await fetch(`${NARUTO_BASE}/${id}`);
  if (!res.ok) throw new Error('Personaje no encontrado.');
  return res.json();
}

async function fetchByName(name) {
  const res = await fetch(`${NARUTO_BASE}?name=${encodeURIComponent(name)}`);
  if (!res.ok) throw new Error('Personaje no encontrado.');
  const body = await res.json();
  const list = body.characters || [];
  if (!list.length) throw new Error('Personaje no encontrado.');
  // Coincidencia exacta primero (la API devuelve parciales: "uzumaki" -> 3).
  const q = name.toLowerCase().trim();
  return list.find((c) => String(c.name).toLowerCase() === q) || list[0];
}

// GET /consultaNaruto?query=sasuke | ?nombre= | /consultaNaruto/:query (nombre o ID)
async function handler(req, res) {
  let query = req.query.query || req.query.nombre || req.params.query;
  if (!query || !String(query).trim()) {
    return res.status(400).json({ error: 'Falta query: usa /consultaNaruto?query=sasuke o ?query=1307' });
  }
  query = String(query).trim();
  try {
    const raw = /^\d+$/.test(query)
      ? await fetchById(String(parseInt(query, 10))) // "01307" -> "1307"
      : await fetchByName(query.toLowerCase());
    const curated = toCurated(raw);
    try {
      await getCatalog();
      const { prevId, nextId } = neighbors(curated.id);
      curated.prevId = prevId;
      curated.nextId = nextId;
    } catch {
      curated.prevId = null; // sin catálogo igual se responde el personaje
      curated.nextId = null;
    }
    return res.json(curated);
  } catch (e) {
    return res.status(404).json({ error: e.message || 'Personaje no encontrado.' });
  }
}

app.get('/consultaNaruto', handler);
app.get('/consultaNaruto/:query', handler);
app.get('/health', (_req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Microservicio Naruto en http://localhost:${PORT} -> GET /consultaNaruto?query=sasuke`);
  getCatalog().then((ids) => console.log(`Catálogo Naruto cargado: ${ids.length} IDs`)).catch(() => {});
});
