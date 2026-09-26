/**
 * Microservicio propio PokeAPI.
 * Arquitectura: Front --GET /consultaPokemon?query=pikachu--> Node --GET pokeapi.co/api/v2/pokemon/:q--> cloud
 * Respuesta JSON curada de vuelta al Front (flechas verdes del boceto).
 */
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;
const POKEAPI_BASE = 'https://pokeapi.co/api/v2/pokemon';

app.use(cors());
app.use(express.json());

function toCurated(p) {
  const stat = (n) => p.stats.find((s) => s.stat.name === n)?.base_stat ?? 0;
  const hp = stat('hp');
  const attack = stat('attack');
  const defense = stat('defense');
  const spAtk = stat('special-attack');
  const spDef = stat('special-defense');
  const speed = stat('speed');
  return {
    id: p.id,
    name: p.name,
    heightM: p.height / 10,
    weightKg: p.weight / 10,
    sprites: {
      official: p.sprites?.other?.['official-artwork']?.front_default || p.sprites?.front_default || null,
      normal: p.sprites?.front_default || null,
      shiny: p.sprites?.front_shiny || null,
    },
    types: (p.types || []).map((t) => t.type.name),
    abilities: (p.abilities || []).map((a) => a.ability.name),
    stats: { hp, attack, defense, spAtk, spDef, speed, total: hp + attack + defense + spAtk + spDef + speed },
    moves: (p.moves || []).map((m) => m.move.name),
  };
}

async function fetchFromPokeApi(query) {
  const res = await fetch(`${POKEAPI_BASE}/${encodeURIComponent(String(query).toLowerCase().trim())}`);
  if (!res.ok) throw new Error('Pokémon no encontrado.');
  return res.json();
}

// GET /consultaPokemon?query=pikachu  |  ?nombre=pikachu  |  /consultaPokemon/:query
async function handler(req, res) {
  let query = req.query.query || req.query.nombre || req.params.query;
  if (!query || !String(query).trim()) {
    return res.status(400).json({ error: 'Falta query: usa /consultaPokemon?query=pikachu o ?query=25' });
  }
  query = String(query).toLowerCase().trim();
  if (/^\d+$/.test(query)) query = String(parseInt(query, 10)); // "025" -> "25"
  try {
    const raw = await fetchFromPokeApi(query);
    return res.json(toCurated(raw));
  } catch (e) {
    return res.status(404).json({ error: e.message || 'Pokémon no encontrado.' });
  }
}

app.get('/consultaPokemon', handler);
app.get('/consultaPokemon/:query', handler);
app.get('/health', (_req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Microservicio PokeAPI en http://localhost:${PORT} -> GET /consultaPokemon?query=pikachu`);
});
