# PokeAPI-Expo · Poké + Ninja + Docentes Explorer (cloud)

App móvil Expo (SDK 54) + **tres microservicios públicos en Render con Swagger**.
El front **nunca** llama a APIs públicas: consume JSON curado de la nube.

```
┌────────┐  GET /pokemons/pikachu   ┌──────────────┐  SQL (10)  ┌───────────┐
│  Front │ ───────────────────────▶ │ Node :Render │ ─────────▶ │ Supabase  │
│ (Expo) │ ◀─────────────────────── │ + Swagger    │ ◀───────── │ Postgres  │
│        │       JSON curado        └──────────────┘  curado    └───────────┘
│        │  GET /characters/sasuke  ┌──────────────┐ Scan (10) ┌───────────┐
│        │ ───────────────────────▶ │ Python:Render│ ─────────▶ │ DynamoDB  │
│        │ ◀─────────────────────── │ + Swagger    │ ◀───────── │ us-east-2 │
│        │       JSON curado        └──────────────┘  curado    │ anime_…   │
│        │  GET /teachers/lotus    ┌──────────────┐ Scan (3)  │ teachers  │
│        │ ───────────────────────▶ │ Node :Render │ ─────────▶ │ us-east-2 │
│        │ ◀─────────────────────── │ nativo+Swagger◀───────── │           │
└────────┘       JSON curado        └──────────────┘  curado    └───────────┘
```

Diseño generado en Stitch (MOBILE) y convertido a React Native con `StyleSheet.create`.

Además, un **Asistente IA** (botón flotante, micro `backend-ai-cloud` con Gemini/OpenAI/DeepSeek y function calling) consulta los tres micros y responde solo sobre estos catálogos. Un **FAB de engranaje** permite elegir proveedor y timeout de sesión.

## Dónde están documentadas las APIs (Swagger)

| Micro | Swagger UI | JSON OpenAPI |
|---|---|---|
| Pokémon Node (Supabase) | `https://pokeapi-expo.onrender.com/api-docs` | `…/api-docs.json` |
| Anime Python (DynamoDB) | `https://pokeapi-expo-naruto.onrender.com/docs` | `…/openapi.json` (más `/redoc`) |
| Docentes Node nativo (DynamoDB) | `https://pokeapi-expo-profesores.onrender.com/docs` | `…/openapi.json` |
| Asistente IA (multi-proveedor) | `https://pokeapi-expo-ia.onrender.com/api-docs` | `…/api-docs.json` |

## Requisitos

| Qué | Versión |
|---|---|
| Node.js | **22 LTS**. Node 26 rompe Metro (`ERR_PACKAGE_PATH_NOT_EXPORTED ./rn-get-polyfills`) |
| Gestor de paquetes | **npm** (hay `package-lock.json`; no usar pnpm) |
| Expo CLI | local del proyecto (`./node_modules/.bin/expo`, 54.x) |
| Expo Go en el teléfono | compatible con **SDK 54** (vale red móvil/WiFi: la API es https pública) |
| Python (solo dev del micro anime) | 3.11+ con `pip install -r backend-anime-cloud/requirements.txt` |
| Google AI Studio / OpenAI / DeepSeek (solo dev del micro asistente IA) | API key free para `backend-ai-cloud/.env` (`GEMINI_API_KEY`, `OPENAI_API_KEY` o `DEEPSEEK_API_KEY`) |

## Instalación

```bash
# 1. Dependencias del front
npm install

# 2. Micro cloud Pokémon (solo si vas a tocarlo en local)
cd backend-poke-cloud && npm install && cd ..
# .env (ignorado): DATABASE_URL=<URI pooler Supabase :6543> + PORT=3101

# 3. Micro cloud Anime (solo si vas a tocarlo en local)
pip install -r backend-anime-cloud/requirements.txt
# backend-anime-cloud/.env (ignorado): AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY,
# AWS_REGION=us-east-2, TABLE_NAME=anime_characters, PORT=3102

# 4. Micro cloud Docentes (solo si vas a tocarlo en local, Node nativo sin Express)
cd backend-teachers-cloud && npm install && cd ..
# Sin .env usa memoria con el mismo seed; con llaves AWS usa DynamoDB:
# AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION=us-east-2,
# TABLE_NAME=teachers, PORT=3103

# 5. Micro cloud Asistente IA (solo si vas a tocarlo en local)
cd backend-ai-cloud && npm install && cd ..
# .env (ignorado): GEMINI_API_KEY y/o OPENAI_API_KEY y/o DEEPSEEK_API_KEY
# + modelos (GEMINI_MODEL, OPENAI_MODEL, DEEPSEEK_MODEL) + PORT=3104
# El front manda provider; sin key para ese proveedor el micro responde 503.
```

## Configuración

`EXPO_PUBLIC_API_URL` / `EXPO_PUBLIC_NARUTO_API_URL` /
`EXPO_PUBLIC_TEACHERS_API_URL` / `EXPO_PUBLIC_AI_API_URL` dicen al front dónde están
los micros (se incrustan al arrancar Expo: cámbialas con Expo detenido + `--clear`).

```bash
# .env.development — nube pública (vale emulador, teléfono y web)
EXPO_PUBLIC_API_URL=https://pokeapi-expo.onrender.com
EXPO_PUBLIC_NARUTO_API_URL=https://pokeapi-expo-naruto.onrender.com
EXPO_PUBLIC_TEACHERS_API_URL=https://pokeapi-expo-profesores.onrender.com
EXPO_PUBLIC_AI_API_URL=https://pokeapi-expo-ia.onrender.com
```

**Parámetros de sesión** (FAB ⚙️): timeout `20/40/80/160 s` (default 40) y proveedor
`Gemini/OpenAI/DeepSeek` (default Gemini). Aplica a Pokémon, Naruto y al asistente;
sin AsyncStorage, al reiniciar vuelven los defaults. El timeout se envía al micro IA
y se aplica también en el front; el backend lo limita a `5–170 s`. Si Render está
dormido (~50 s), sube el timeout a 80 o 160 s.

## Cómo correrlo

```bash
# App Expo (los micros ya viven en Render, no hace falta terminales de backend)
./node_modules/.bin/expo start --clear
```

Luego escanea el QR con Expo Go. `npm run web` también sirve (`expo start --web`).

### Desarrollo local de micros (opcional)

```bash
# Pokémon :3101 + Swagger http://localhost:3101/api-docs
cd backend-poke-cloud && node seed.js && npm start

# Anime :3102 + Swagger http://localhost:3102/docs
cd backend-anime-cloud && python seed.js && uvicorn main:app --port 3102

# Docentes :3103 + Docs http://localhost:3103/docs (Node nativo, sin Express, CRUD)
cd backend-teachers-cloud && npm run seed && npm start
# (el seed crea la tabla teachers si falta y carga teachers.seed.json; sin llaves AWS el micro responde 503, sin fallback en memoria)

# Asistente IA :3104 + Swagger http://localhost:3104/api-docs
# (requiere al menos una API key en .env: GEMINI_API_KEY / OPENAI_API_KEY / DEEPSEEK_API_KEY)
cd backend-ai-cloud && npm start
```

## Uso

1. Busca por **nombre o número**: `pikachu`, `25`, `025` (normaliza ceros), `mewtwo`.
   En Naruto: `sasuke`, `1307`, `pain` (alias de Nagato), `naruto`.
   En Docentes: `lotus`, `javier`, `elfar` o `1`, `2`, `3`.
2. Solo existen **10 por área Pokémon/Naruto** (ver Datos abajo);
   fuera de ellos responde `404`. **Docentes es CRUD abierto**: tantos
   como haya en DynamoDB (semilla inicial en `teachers.seed.json`).
3. **5 tabs abajo**: Galería/Datos Pokémon + N-Galería/N-Datos Naruto + Docentes.
4. **Galería Pokémon** (tab 1): arte oficial + sprites Normal/Shiny (= 3 imágenes) +
   anterior/siguiente dentro de los 10.
5. **Datos Pokémon** (tab 2): altura, peso, 6 stats con barras, tipos, habilidades y
   **todos** los movimientos.
6. **N-Galería**: imágenes + nombre + clan/aldea + jutsu insignia + anterior/siguiente
   (`prevId`/`nextId` del payload, los IDs no son secuenciales).
   **N-Datos**: físico, debut, naturalezas, jutsus, familia.
7. **Docentes** (tab 5, header `Profesores`): lista desde DynamoDB
   (foto, profesión) + botón **Ver información** (fuera de los tabs) que abre el
   detalle (descripción + link a LinkedIn) con botón **Volver**.
   Admin CRUD: **Agregar** en la lista, **Editar/Eliminar** en lista y detalle
   (formulario `TeacherForm.js`, sin auth por decisión del proyecto).
8. **Asistente IA** (botón flotante ✨, visible en cualquier tab): chat que responde
   **solo con datos de las BD cloud** (consulta los micros en vivo; sin conocimiento
   propio del modelo) y se niega amablemente a otros temas. Sin memoria: cada
   pregunta es independiente. El proveedor se elige en ⚙️; el timeout se aplica a
   la consulta completa (front + micro).
9. **Ajustes ⚙️** (FAB sobre el de IA): timeout `20/40/80/160 s` y proveedor
   `Gemini/OpenAI/DeepSeek`. Solo sesión: al reiniciar vuelven 40 s y Gemini.

## Estructura

```
App.js                  Entrada: Provider + header + 4 estados + tabs
index.js                registerRootComponent
theme/tokens.js         Paleta (rojo fandom #D64545, amber #FFC83D) y radios
services/pokemonService.js  fetch al micro cloud /pokemons + ApiError (sin axios, sin fallback local)
services/narutoService.js   fetch al micro cloud /characters + NarutoApiError
services/teachersService.js  fetch al micro cloud /teachers + TeachersApiError (GET path/query; CRUD con body JSON)
services/aiService.js       fetch al micro cloud /chat + AiApiError (provider/timeout; sin memoria)
services/http.js            createTimeoutSignal + timeoutMessage (timeout compartido)
context/SettingsContext.js  timeoutMs (20/40/80/160) + aiProvider (gemini/openai/deepseek), solo sesión
context/PokemonContext.js   Estado global; next/prev por lista de la nube (getPokemonIds) + timeout/abort
context/NarutoContext.js    Estado global; next/prev por prevId/nextId del payload + timeout/abort
context/TeachersContext.js  Estado global; lista auto + vista list|detail + admin CRUD (formMode/submitForm/removeTeacher)
context/AssistantContext.js Estado del chat IA (hilo local + provider/timeout/abort/open/loading/send/clear)
components/
  SearchBar.js  · BottomTabs.js  · GalleryScreen.js (3 imágenes)
  DataScreen.js (datos) · StatBar.js · EmptyState.js
  NarutoGalleryScreen.js · NarutoDataScreen.js
  TeachersScreen.js (lista + Agregar/Borrar + botón Ver información) · TeacherDetailScreen.js (detalle + Editar/Eliminar) · TeacherForm.js (form Crear/Editar)
  AssistantFab.js (botón flotante) · AssistantModal.js (chat modal del asistente IA)
  SettingsFab.js (⚙️) · SettingsModal.js (timeout + proveedor)
backend-poke-cloud/     Micro Node+Swagger: /pokemons + /health (Supabase). Ver su README.
backend-anime-cloud/    Micro Python+Swagger: /characters + /health (DynamoDB). Ver su README.
backend-teachers-cloud/ Micro Node NATIVO sin Express + Swagger CRUD: /teachers + /health (solo DynamoDB, 503 sin BD). Ver su README.
backend-ai-cloud/       Micro Node+Express+Swagger: POST /chat multi-proveedor (function calling a los otros 3 micros) + /health. Ver su README.
backend/ · backend-naruto/  Micros locales legacy (puertos 3001/3002): respaldo de desarrollo.
.tours/                 Tour guiado del flujo (CodeTour).
docs/img/               Evidencias del reporte de funcionamiento.
```

## API cloud

| Micro | Método | Descripción |
|---|---|---|
| Pokémon | `GET /pokemons` | Lista los 10 (`id`, `name`, `official`, `types`) |
| Pokémon | `GET /pokemons/:query` | Curado por nombre o ID |
| Pokémon | `GET /health` | `{"ok":true,"db":true}` |
| Anime | `GET /characters` | Lista los 10 (resumen) |
| Anime | `GET /characters/:query` | Curado por nombre, alias o ID (+ `prevId`/`nextId`) |
| Anime | `GET /health` | `{"ok":true,"db":true}` |
| Docentes | `GET /teachers` | Lista resumen (`id`, `name`, `profession`, `photo`) |
| Docentes | `GET /teachers?query=leonardo` | Filtrado por query param (nombre/profesión) |
| Docentes | `GET /teachers/:query` | Detalle por ID (`2`) o nombre/alias |
| Docentes | `POST /teachers` | Crea (body JSON `name`+`profession`, → `201`, id = max+1) |
| Docentes | `PUT /teachers/:id` | Reemplazo total por ID numérico (body JSON) |
| Docentes | `PATCH /teachers/:id` | Parcial por ID numérico (body JSON) |
| Docentes | `DELETE /teachers/:id` | Borra por ID numérico |
| Docentes | `GET /health` | `{"ok":true,"db":true,"mode":"dynamodb"}` (`503` sin BD, sin fallback) |
| Asistente | `POST /chat` | Pregunta al asistente IA (`{"message":"…","provider":"gemini|openai|deepseek","timeoutMs":40000}` → `{"reply":"…","provider":"…","model":"…"}`); solo catálogo, sin memoria |
| Asistente | `GET /health` | `{"ok":true,"defaultProvider":"gemini","providers":{…}}` (cada proveedor indica `configured`) |

Respuesta curada Pokémon (ej. `/pokemons/25`):

```json
{
  "id": 25, "name": "pikachu", "heightM": 0.4, "weightKg": 6,
  "sprites": { "official": "https://…", "normal": "https://…", "shiny": "https://…" },
  "types": ["electric"], "abilities": ["static", "lightning-rod"],
  "stats": { "hp": 35, "attack": 55, "defense": 40, "spAtk": 50, "spDef": 50, "speed": 90, "total": 320 },
  "moves": ["mega-punch", "pay-day", "thunder-punch", "…"]
}
```

Errores: `400` sin query / validación CRUD (`name`+`profession`) · `404` fuera del catálogo (`{error: "…"}`; FastAPI usa `{detail: "…"}`) · `503` docentes sin BD (sin fallback).
Pokémon/Anime solo lectura por `GET` (`405` a otro método); **Docentes permite escrituras CRUD con body JSON** (abiertas sin auth). El asistente IA suma `429` (rate limit o free tier), `502` (proveedor o micros no disponibles), `503` (proveedor sin API key) y `504` (timeout configurado agotado).

Respuesta curada Docentes (ej. `/teachers/2`):

```json
{
  "id": 2, "name": "Lotus King Salcedo Vallejo",
  "profession": "Psicologo · Director de Investigacion y Proyeccion Social UNINPAHU",
  "headline": "Psicologo, maestrando en Filosofia (UNAL)…",
  "description": "Dirige Investigacion, Proyeccion Social…",
  "photo": "https://…", "profileUrl": "https://www.linkedin.com/in/…",
  "area": "Investigacion UNINPAHU", "order": 2
}
```

## Datos en la nube (10 + 10 + N docentes)

- **Supabase Postgres** (tabla `pokemons`): bulbasaur, charizard, squirtle, pikachu,
  gengar, eevee, snorlax, dragonite, mewtwo, lucario. Seed real desde `pokeapi.co`
  (`backend-poke-cloud/seed.js`).
- **DynamoDB `us-east-2`** (tabla `anime_characters`): Naruto Uzumaki, Sasuke Uchiha,
  Sakura Haruno, Kakashi Hatake, Itachi Uchiha, Madara Uchiha, Nagato (alias `pain`),
  Jiraiya, Hinata Hyūga, Gaara. Seed real desde `dattebayo-api`
  (`backend-anime-cloud/seed.py`).
- **DynamoDB `us-east-2`** (tabla `teachers`, CRUD): semilla inicial Elfar,
  Leonardo, Fredy (foto, profesión y descripción + `profileUrl`) en
  `backend-teachers-cloud/teachers.seed.json` (respaldo para `npm run seed`;
  fotos sin scraping —ver README del micro). El front administra altas/bajas/cambios.

## Deploy (Render, plan free)

Los cuatro son Web Service de la rama `feature/escalamiento-cloud-dbs` (ver `render.yaml`
de cada micro): build, start, `rootDir`, health check `/health` y env vars
(`DATABASE_URL` / llaves AWS + región + tabla / `GEMINI_API_KEY`, `OPENAI_API_KEY`,
`DEEPSEEK_API_KEY` + modelos) pegadas **en el dashboard**, nunca en git (`.env` ignorados).
El micro docentes es Node nativo sin Express (`npm start` → `server.js`, con `index.js`
puente por si la plataforma arranca con `node index.js`).

> Render gratis duerme sin tráfico: la primera petición puede tardar ~50s
> (la app lo muestra como loading; reintenta si expira).

## Notas de red

- Con la nube https ya no hace falta IP LAN, firewall ni túnel para la API.
- Los micros locales legacy (`backend/` :3001, `backend-naruto/` :3002) siguen
  disponibles para desarrollo sin internet contra la nube.

## Problemas conocidos

| Síntoma | Causa | Fix |
|---|---|---|
| `ERR_PACKAGE_PATH_NOT_EXPORTED ./rn-get-polyfills` | Node 26 o CLI 57 de pnpm | Node 22 + `./node_modules/.bin/expo` + `npm install` |
| Primera búsqueda tarda/falla | Render dormido (free) | Esperar ~50s y reintentar |
| `404` buscando cualquier nombre | Solo existen 10 por área Pokémon/Naruto; docentes depende de DynamoDB | Usa los listados en Datos o el CRUD |
| QR carga infinito | VM en NAT / firewall | `--tunnel` o adaptador puente |
| Expo Go avisa de SDK | Go más nuevo que el proyecto (54) | `npx expo upgrade` (cambia el pin de `AGENTS.md`) |
| DynamoDB `AccessDenied` en `us-east-1` | SCP de cuenta educativa lo bloquea | Usar `us-east-2` |
| Asistente dice que "la nube está despertando" | Micros/servicio Render dormidos (free) | Reintentar: el propio chat lo indica (~50s) |
