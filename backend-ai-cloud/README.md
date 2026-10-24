# AI Cloud — Asistente IA multi-proveedor (Node + Express + Swagger)

Asistente de la app con cerebro **Gemini, Groq o DeepSeek** (el front elige) y
**function calling** contra los micros cloud existentes: Pokémon
(`backend-poke-cloud`), Anime (`backend-anime-cloud`) y Docentes
(`backend-teachers-cloud`). Desplegado en Render.

- Producción: `https://pokeapi-expo-ia.onrender.com` (Web Service `pokeapi-expo-ia` en Render)
- **Swagger UI: [`/api-docs`](https://pokeapi-expo-ia.onrender.com/api-docs)** · JSON: `/api-docs.json`

## Endpoints

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/` | Info del servicio (+ proveedor default) |
| GET | `/health` | `{"ok":true,"defaultProvider":"gemini","providers":{…}}` (cada uno con `configured`) |
| POST | `/chat` | `{"message":"…","provider":"gemini|groq|deepseek","timeoutMs":40000}` → `{"reply":"…","provider":"…","model":"…"}` |
| GET | `/openapi.json` (+ `/api-docs.json`) | Spec OpenAPI 3.0 |
| GET | `/api-docs` | Swagger UI interactivo |

## Proveedores y timeout

- **Gemini** (`GEMINI_API_KEY`, default `gemini-3.5-flash-lite`).
- **Groq** (`GROQ_API_KEY`, default `llama-3.3-70b-versatile`).
- **DeepSeek** (`DEEPSEEK_API_KEY`, default `deepseek-chat`, API compatible con OpenAI).
- El front manda `provider`; sin key para ese proveedor el micro responde **503**
  (no mata el proceso). `DEFAULT_AI_PROVIDER` define el fallback.
- `timeoutMs` se limita a **5–170 s** (default 40 s) y cubre la consulta completa:
  índice de catálogo + rondas del modelo + herramientas. Al agotarse responde **504**.
- Cada request es independiente: **sin memoria** (el front no envía historial).

## Alcance (por decisión del proyecto)

- **Respuestas 100% ancladas a las BD cloud**: la única fuente del asistente son
  los resultados de las herramientas (Supabase/DynamoDB). Prohibido el conocimiento
  propio del modelo (historia, curiosidades, popularidad, datos de otras obras).
- **Consulta forzada** (Gemini): si la pregunta menciona una entidad o tema del
  catálogo (índice de nombres/temas cacheado desde los micros, TTL 5 min), la primera
  llamada usa `functionCallingConfig: { mode: "ANY" }` para obligar a consultar la
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
- **Solo lectura**: usa las herramientas de consulta de los micros; nunca escribe.
- **Rate limit** en memoria: 8 preguntas/minuto por IP (protege los free tiers).
- `message` máximo 500 caracteres.

## Herramientas (function calling)

| Herramienta | Consulta |
|---|---|
| `list_pokemons` / `get_pokemon` | `GET /pokemons` y `/pokemons/:query` |
| `list_characters` / `get_character` | `GET /characters` y `/characters/:query` |
| `list_teachers` / `get_teacher` | `GET /teachers` y `/teachers/:query` |

Los resultados se **sanitizan** (sin imágenes/URLs salvo `profileUrl`; movimientos
truncados a total + primeros 12) antes de enviarlos al modelo. Máximo 4 rondas de
herramientas por pregunta. Cada micro se reintenta una vez ante `502/503/504` o
fallo de red (spin-up de Render).

> Detalle Gemini 3: las partes de `functionCall` se reenvían tal cual
> (incluido `thoughtSignature`), requisito del modelo.

## Desarrollo local

```bash
npm install
cp .env.example .env   # completa al menos una key: GEMINI_API_KEY / GROQ_API_KEY / DEEPSEEK_API_KEY
npm start              # :3104, docs en http://localhost:3104/api-docs

curl http://localhost:3104/health
curl -X POST http://localhost:3104/chat -H "Content-Type: application/json" -d '{"message":"¿Cuánto pesa Pikachu?"}'
curl -X POST http://localhost:3104/chat -H "Content-Type: application/json" -d '{"message":"¿Quién es Sasuke?","provider":"groq","timeoutMs":80000}'
curl -X POST http://localhost:3104/chat -H "Content-Type: application/json" -d '{"message":"Cuéntame un chiste"}'
```

Variables opcionales para probar contra micros locales:
`POKE_API_URL=http://localhost:3101`, `NARUTO_API_URL=http://localhost:3102`,
`TEACHERS_API_URL=http://localhost:3103`.

Errores: `400` sin `message`/provider inválido/muy largo · `429` rate limit local o
free tier · `502` proveedor o micros no disponibles · `503` proveedor sin API key ·
`504` timeout configurado agotado.

## Deploy (Render)

Web Service, rama `feature/escalamiento-cloud-dbs`, `rootDir: backend-ai-cloud`,
build `npm install`, start `npm start` (incluye `index.js` puente por si la
plataforma arranca con `node index.js`, igual que teachers-cloud), health check `/health`.
Pega en el dashboard las keys que quieras habilitar (`GEMINI_API_KEY`,
`GROQ_API_KEY`, `DEEPSEEK_API_KEY`; sync: false, nunca en git) y sus modelos.
`DEFAULT_AI_PROVIDER` es opcional (default `gemini`). Ver `render.yaml`.
