/**
 * Microservicio cloud Pokémon (Node + Express + Swagger).
 * Lee 10 pokémon curados desde Supabase Postgres (pooler :6543).
 * Docs interactivas: GET /api-docs
 */
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const swaggerUi = require('swagger-ui-express');
const swaggerJSDoc = require('swagger-jsdoc');

const PORT = process.env.PORT || 3101;
if (!process.env.DATABASE_URL) {
  console.error('Falta DATABASE_URL en .env (URI pooler Supabase).');
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // pooler Supabase exige SSL
});

const app = express();
app.use(cors());
app.use(express.json());

function toCurated(r) {
  return {
    id: r.id,
    name: r.name,
    heightM: Number(r.height_m),
    weightKg: Number(r.weight_kg),
    sprites: r.sprites,
    types: r.types,
    abilities: r.abilities,
    stats: r.stats,
    moves: r.moves,
  };
}

const swaggerSpec = swaggerJSDoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'PokeAPI Cloud — microservicio Pokémon (Supabase)',
      version: '1.0.0',
      description: '10 pokémon curados servidos desde Supabase Postgres. Fuente original de seed: pokeapi.co.',
    },
    servers: [{ url: 'http://localhost:' + PORT, description: 'Local' }],
  },
  apis: ['./server.js'],
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get('/api-docs.json', (_req, res) => res.json(swaggerSpec));

/**
 * @openapi
 * /health:
 *   get:
 *     summary: Salud del microservicio (+ DB)
 *     responses:
 *       200:
 *         description: OK
 */
app.get('/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ ok: true, db: true });
  } catch {
    res.status(500).json({ ok: false, db: false });
  }
});

/**
 * @openapi
 * /pokemons:
 *   get:
 *     summary: Lista los 10 pokémon (resumen)
 *     responses:
 *       200:
 *         description: Arreglo {id, name, official, types}
 */
app.get('/pokemons', async (_req, res) => {
  const { rows } = await pool.query(
    "SELECT id, name, sprites->>'official' AS official, types FROM pokemons ORDER BY id"
  );
  res.json(rows);
});

/**
 * @openapi
 * /pokemons/{query}:
 *   get:
 *     summary: Pokémon curado por nombre o ID
 *     parameters:
 *       - in: path
 *         name: query
 *         required: true
 *         schema: { type: string }
 *         example: pikachu
 *     responses:
 *       200:
 *         description: JSON curado (mismo shape que /consultaPokemon)
 *       404:
 *         description: No existe en la nube (solo hay 10)
 */
app.get('/pokemons/:query', async (req, res) => {
  let q = String(req.params.query || '').toLowerCase().trim();
  if (!q) return res.status(400).json({ error: 'Falta query: usa /pokemons/pikachu o /pokemons/25' });
  if (/^\d+$/.test(q)) q = String(parseInt(q, 10));
  const { rows } = /^\d+$/.test(q)
    ? await pool.query('SELECT * FROM pokemons WHERE id = $1', [Number(q)])
    : await pool.query('SELECT * FROM pokemons WHERE name = $1', [q]);
  if (!rows.length) return res.status(404).json({ error: 'Pokémon no encontrado en la nube (solo 10 disponibles).' });
  res.json(toCurated(rows[0]));
});

app.listen(PORT, () => {
  console.log(`Poke cloud en http://localhost:${PORT} -> docs en /api-docs`);
});
