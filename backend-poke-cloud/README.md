# Poke Cloud — microservicio Pokémon (Node + Supabase)

Sirve 10 pokémon curados desde Supabase Postgres. Desplegado en Render.

- Producción: `https://pokeapi-expo.onrender.com`
- **Swagger UI: [`/api-docs`](https://pokeapi-expo.onrender.com/api-docs)** · JSON: `/api-docs.json`

## Endpoints

| Método | Descripción |
|---|---|
| `GET /health` | `{"ok":true,"db":true}` (verifica Supabase) |
| `GET /pokemons` | Lista los 10 (`id`, `name`, `official`, `types`) |
| `GET /pokemons/:query` | Curado por nombre o ID (`pikachu`, `25`, `025`→`25`). `404` fuera de los 10 |

## Desarrollo local

```bash
npm install
cp .env.example .env  # o crea .env con DATABASE_URL (URI pooler Supabase :6543) + PORT
node seed.js          # crea tabla + carga los 10 desde pokeapi.co
npm start             # :3101, docs en http://localhost:3101/api-docs
```

## Deploy (Render)

Web Service, rama `feature/escalamiento-cloud-dbs`, `rootDir: backend-poke-cloud`,
build `npm install`, start `npm start`, health check `/health`.
Env var `DATABASE_URL` se pega en el dashboard (nunca en git). Ver `render.yaml`.
