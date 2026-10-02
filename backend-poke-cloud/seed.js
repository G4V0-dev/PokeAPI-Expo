/**
 * Seed: crea tabla pokemons (si falta) y carga 10 clásicos desde pokeapi.co
 * ya curados al shape que consume el front.
 * Uso: node seed.js  (lee DATABASE_URL de .env)
 */
require('dotenv').config();
const { Pool } = require('pg');

const IDS = [1, 6, 7, 25, 94, 133, 143, 149, 150, 448]; // bulbasaur, charizard, squirtle, pikachu, gengar, eevee, snorlax, dragonite, mewtwo, lucario (10 clásicos)

const DDL = `
CREATE TABLE IF NOT EXISTS pokemons (
  id integer primary key,
  name text unique not null,
  height_m numeric not null,
  weight_kg numeric not null,
  sprites jsonb not null,
  types text[] not null,
  abilities text[] not null,
  stats jsonb not null,
  moves text[] not null
);`;

function toRow(p) {
  const stat = (n) => p.stats.find((s) => s.stat.name === n)?.base_stat ?? 0;
  const hp = stat('hp'), attack = stat('attack'), defense = stat('defense');
  const spAtk = stat('special-attack'), spDef = stat('special-defense'), speed = stat('speed');
  return {
    id: p.id,
    name: p.name,
    height_m: p.height / 10,
    weight_kg: p.weight / 10,
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

(async () => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await pool.query(DDL);
  for (const id of IDS) {
    const raw = await (await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`)).json();
    const r = toRow(raw);
    await pool.query(
      `INSERT INTO pokemons (id,name,height_m,weight_kg,sprites,types,abilities,stats,moves)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name, height_m=EXCLUDED.height_m,
         weight_kg=EXCLUDED.weight_kg, sprites=EXCLUDED.sprites, types=EXCLUDED.types,
         abilities=EXCLUDED.abilities, stats=EXCLUDED.stats, moves=EXCLUDED.moves`,
      [r.id, r.name, r.height_m, r.weight_kg, JSON.stringify(r.sprites), r.types, r.abilities, JSON.stringify(r.stats), r.moves]
    );
    console.log(`seed OK #${r.id} ${r.name}`);
  }
  const { rows } = await pool.query('SELECT id, name FROM pokemons ORDER BY id');
  console.log(`TOTAL en nube: ${rows.length}`, rows.map((x) => x.name).join(', '));
  await pool.end();
})().catch((e) => { console.error('SEED FAIL:', e.message); process.exit(1); });
