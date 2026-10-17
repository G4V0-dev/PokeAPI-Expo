# AI Cloud — Asistente IA (Node + Express + Swagger + Gemini)

Asistente de la app con cerebro **Gemini** (Google AI Studio) y **function calling**
contra los micros cloud existentes: Pokémon (`backend-poke-cloud`), Anime
(`backend-anime-cloud`) y Docentes (`backend-teachers-cloud`). Desplegado en Render.

- Producción: `https://pokeapi-expo-ia.onrender.com` (Web Service `pokeapi-expo-ia` en Render)
- **Swagger UI: [`/api-docs`](https://pokeapi-expo-ia.onrender.com/api-docs)** · JSON: `/api-docs.json`

## Endpoints

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/` | Info del servicio (+ modelo activo) |
| GET | `/health` | `{"ok":true,"gemini":true,"model":"gemini-3.5-flash-lite"}` |
| POST | `/chat` | Pregunta al asistente: body `{"message":"¿Cuánto pesa Pikachu?"}` → `{"reply":"…","model":"…"}` |
| GET | `/openapi.json` (+ `/api-docs.json`) | Spec OpenAPI 3.0 |
| GET | `/api-docs` | Swagger UI interactivo |

## Alcance (por decisión del proyecto)

- **Respuestas 100% ancladas a las BD cloud**: la única fuente del asistente son
  los resultados de las herramientas (Supabase/DynamoDB). Prohibido el conocimiento
  propio del modelo (historia, curiosidades, popularidad, datos de otras obras).
- **Consulta forzada**: si la pregunta menciona una entidad o tema del catálogo
  (índice de nombres/temas cacheado desde los micros, TTL 5 min), la primera llamada
  a Gemini usa `functionCallingConfig: { mode: "ANY" }` para obligar a consultar la
  BD antes de responder. Temperatura 0.
- **Solo** responde sobre pokémon, personajes de Naruto y docentes UNINPAHU; otros
  temas (chistes, código, tareas, etc.) se **niegan amablemente**; saludos
  responden cortesía breve sin herramientas.
- **Derivados permitidos** con campos consultados: comparar, calcular y superlativos
  (p. ej. "el mejor" → según total de stats, aclarando que es según el catálogo).
- **Dato ausente** (entidad no registrada o campo que la tabla no guarda) → "ese dato
  no está en el catálogo" + sugerencia del tab; nunca se completa con conocimiento externo.
- Pokémon: movimientos truncados (total + primeros 12; el resto en el tab Datos).
  Docentes: `profileUrl` (LinkedIn) se comparte si lo piden.
- **Sin memoria**: cada mensaje es independiente (el front no envía historial).
- **Solo lectura**: usa las herramientas de consulta de los micros; nunca escribe.
- **Rate limit** en memoria: 8 preguntas/minuto por IP (protege el free tier).
- `message` máximo 500 caracteres.

## Herramientas (function calling)

| Herramienta | Consulta |
|---|---|
| `list_pokemons` / `get_pokemon` | `GET /pokemons` y `/pokemons/:query` |
| `list_characters` / `get_character` | `GET /characters` y `/characters/:query` |
| `list_teachers` / `get_teacher` | `GET /teachers` y `/teachers/:query` |

Los resultados se **sanitizan** (sin imágenes/URLs salvo `profileUrl`; movimientos
truncados a total + primeros 12) antes de enviarlos al modelo. Máximo 4 rondas de
herramientas por pregunta.

> Detalle Gemini 3: las partes de `functionCall` se reenvían tal cual
> (incluido `thoughtSignature`), requisito del modelo.

## Desarrollo local

```bash
npm install
cp .env.example .env   # o crea .env con GEMINI_API_KEY + GEMINI_MODEL (+ PORT=3104)
npm start              # :3104, docs en http://localhost:3104/api-docs

curl http://localhost:3104/health
curl -X POST http://localhost:3104/chat -H "Content-Type: application/json" -d '{"message":"¿Cuánto pesa Pikachu?"}'
curl -X POST http://localhost:3104/chat -H "Content-Type: application/json" -d '{"message":"Cuéntame un chiste"}'
```

Variables opcionales para probar contra micros locales:
`POKE_API_URL=http://localhost:3101`, `NARUTO_API_URL=http://localhost:3102`,
`TEACHERS_API_URL=http://localhost:3103`.

Errores: `400` sin `message` o muy largo · `429` rate limit local o free tier
de Gemini · `502` Gemini o los micros no disponibles.

## Deploy (Render)

Web Service, rama `feature/escalamiento-cloud-dbs`, `rootDir: backend-ai-cloud`,
build `npm install`, start `npm start` (incluye `index.js` puente por si la
plataforma arranca con `node index.js`, igual que teachers-cloud), health check `/health`.
`GEMINI_API_KEY` se pega en el dashboard (sync: false, nunca en git);
`GEMINI_MODEL` queda en `gemini-3.5-flash-lite` (cambiable sin tocar código).
Ver `render.yaml`.
