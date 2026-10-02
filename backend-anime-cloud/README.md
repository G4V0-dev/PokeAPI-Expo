# Anime Cloud — microservicio personajes (Python + DynamoDB)

Sirve 10 personajes de Naruto curados desde DynamoDB (`us-east-2`, tabla `anime_characters`). Desplegado en Render.

- Producción: `https://pokeapi-expo-naruto.onrender.com`
- **Swagger UI: [`/docs`](https://pokeapi-expo-naruto.onrender.com/docs)** (auto, FastAPI) · JSON: `/openapi.json` · `/redoc`

## Endpoints

| Método | Descripción |
|---|---|
| `GET /health` | `{"ok":true,"db":true}` (verifica DynamoDB) |
| `GET /characters` | Lista los 10 (resumen con imagen, clan, jutsu insignia) |
| `GET /characters/:query` | Curado por nombre o ID (`sasuke`, `1307`, alias `pain`→Nagato). Incluye `prevId`/`nextId` por orden de seed. `404` fuera de los 10 |

## Desarrollo local

```bash
pip install -r requirements.txt
# crea .env con AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION=us-east-2,
# TABLE_NAME=anime_characters, PORT=3102 (nunca en git)
python seed.py   # resuelve los 10 desde dattebayo-api y los guarda curados
uvicorn main:app --port 3102   # docs en http://localhost:3102/docs
```

## Deploy (Render)

Web Service Python, rama `feature/escalamiento-cloud-dbs`, `rootDir: backend-anime-cloud`,
build `pip install -r requirements.txt`, start `uvicorn main:app --host 0.0.0.0 --port $PORT`,
health check `/health`. Las 4 env vars se pegan en el dashboard (nunca en git). Ver `render.yaml`.
