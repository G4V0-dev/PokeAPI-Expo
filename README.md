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

## Dónde están documentadas las APIs (Swagger)

| Micro | Swagger UI | JSON OpenAPI |
|---|---|---|
| Pokémon Node (Supabase) | `https://pokeapi-expo.onrender.com/api-docs` | `…/api-docs.json` |
| Anime Python (DynamoDB) | `https://pokeapi-expo-naruto.onrender.com/docs` | `…/openapi.json` (más `/redoc`) |
| Docentes Node nativo (DynamoDB) | `https://pokeapi-expo-profesores.onrender.com/docs` | `…/openapi.json` |

## Requisitos

| Qué | Versión |
|---|---|
| Node.js | **22 LTS**. Node 26 rompe Metro (`ERR_PACKAGE_PATH_NOT_EXPORTED ./rn-get-polyfills`) |
| Gestor de paquetes | **npm** (hay `package-lock.json`; no usar pnpm) |
| Expo CLI | local del proyecto (`./node_modules/.bin/expo`, 54.x) |
| Expo Go en el teléfono | compatible con **SDK 54** (vale red móvil/WiFi: la API es https pública) |
| Python (solo dev del micro anime) | 3.11+ con `pip install -r backend-anime-cloud/requirements.txt` |

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
```

## Configuración

`EXPO_PUBLIC_API_URL` / `EXPO_PUBLIC_NARUTO_API_URL` /
`EXPO_PUBLIC_TEACHERS_API_URL` dicen al front dónde están
los micros (se incrustan al arrancar Expo: cámbialas con Expo detenido + `--clear`).

```bash
# .env.development — nube pública (vale emulador, teléfono y web)
EXPO_PUBLIC_API_URL=https://pokeapi-expo.onrender.com
EXPO_PUBLIC_NARUTO_API_URL=https://pokeapi-expo-naruto.onrender.com
EXPO_PUBLIC_TEACHERS_API_URL=https://pokeapi-expo-profesores.onrender.com
```

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

# Docentes :3103 + Docs http://localhost:3103/docs (Node nativo, sin Express)
cd backend-teachers-cloud && npm run seed && npm start
# (el seed crea la tabla teachers si falta; sin llaves AWS el micro corre en memoria)
```

## Uso

1. Busca por **nombre o número**: `pikachu`, `25`, `025` (normaliza ceros), `mewtwo`.
   En Naruto: `sasuke`, `1307`, `pain` (alias de Nagato), `naruto`.
   En Docentes: `lotus`, `javier`, `elfar` o `1`, `2`, `3`.
2. Solo existen **10 por área Pokémon/Naruto y 3 docentes** (ver Datos abajo);
   fuera de ellos responde `404`.
3. **5 tabs abajo**: Galería/Datos Pokémon + N-Galería/N-Datos Naruto + Docentes.
4. **Galería Pokémon** (tab 1): arte oficial + sprites Normal/Shiny (= 3 imágenes) +
   anterior/siguiente dentro de los 10.
5. **Datos Pokémon** (tab 2): altura, peso, 6 stats con barras, tipos, habilidades y
   **todos** los movimientos.
6. **N-Galería**: imágenes + nombre + clan/aldea + jutsu insignia + anterior/siguiente
   (`prevId`/`nextId` del payload, los IDs no son secuenciales).
   **N-Datos**: físico, debut, naturalezas, jutsus, familia.
7. **Docentes** (tab 5, header `Profesores`): lista simple de los 3 docentes UNINPAHU
   (foto, profesión) + botón **Ver información** (fuera de los tabs) que abre el
   detalle (descripción de la red social + link a LinkedIn) con botón **Volver**.

## Estructura

```
App.js                  Entrada: Provider + header + 4 estados + tabs
index.js                registerRootComponent
theme/tokens.js         Paleta (rojo fandom #D64545, amber #FFC83D) y radios
services/pokemonService.js  fetch al micro cloud /pokemons + ApiError (sin axios, sin fallback local)
services/narutoService.js   fetch al micro cloud /characters + NarutoApiError
services/teachersService.js  fetch al micro cloud /teachers + TeachersApiError (path/query, sin body)
context/PokemonContext.js   Estado global; next/prev por lista de la nube (getPokemonIds)
context/NarutoContext.js    Estado global; next/prev por prevId/nextId del payload
context/TeachersContext.js  Estado global simple; lista auto + vista list|detail
components/
  SearchBar.js  · BottomTabs.js  · GalleryScreen.js (3 imágenes)
  DataScreen.js (datos) · StatBar.js · EmptyState.js
  NarutoGalleryScreen.js · NarutoDataScreen.js
  TeachersScreen.js (lista 3 + botón Ver información) · TeacherDetailScreen.js
backend-poke-cloud/     Micro Node+Swagger: /pokemons + /health (Supabase). Ver su README.
backend-anime-cloud/    Micro Python+Swagger: /characters + /health (DynamoDB). Ver su README.
backend-teachers-cloud/ Micro Node NATIVO sin Express + Swagger: /teachers + /health (DynamoDB). Ver su README.
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
| Docentes | `GET /teachers` | Lista los 3 (resumen: `id`, `name`, `profession`, `photo`) |
| Docentes | `GET /teachers?query=lotus` | Filtrado por query param (nombre/profesión) |
| Docentes | `GET /teachers/:query` | Detalle por ID (`2`) o nombre/alias (`lotus`, `elfar`, `javier`) |
| Docentes | `GET /health` | `{"ok":true,"db":true,"mode":"dynamodb"}` |

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

Errores: `400` sin query · `404` fuera del catálogo (`{error: "…"}`; FastAPI usa `{detail: "…"}`).
Solo lectura por `GET`: `405` a otro método (sin body params).

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

## Datos en la nube (10 + 10 + 3)

- **Supabase Postgres** (tabla `pokemons`): bulbasaur, charizard, squirtle, pikachu,
  gengar, eevee, snorlax, dragonite, mewtwo, lucario. Seed real desde `pokeapi.co`
  (`backend-poke-cloud/seed.js`).
- **DynamoDB `us-east-2`** (tabla `anime_characters`): Naruto Uzumaki, Sasuke Uchiha,
  Sakura Haruno, Kakashi Hatake, Itachi Uchiha, Madara Uchiha, Nagato (alias `pain`),
  Jiraiya, Hinata Hyūga, Gaara. Seed real desde `dattebayo-api`
  (`backend-anime-cloud/seed.py`).
- **DynamoDB `us-east-2`** (tabla `teachers`): Elfar Didier Morantes Sánchez,
  Lotus King Salcedo Vallejo, Javier Duvan Amado Acosta (foto, profesión y
  descripción de LinkedIn + `profileUrl`). Seed curado desde info pública
  (`backend-teachers-cloud/seed.js`; fotos placeholder `ui-avatars` porque
  LinkedIn bloquea scraping sin sesión —ver README del micro).

## Deploy (Render, plan free)

Los tres son Web Service de la rama `feature/escalamiento-cloud-dbs` (ver `render.yaml`
de cada micro): build, start, `rootDir`, health check `/health` y env vars
(`DATABASE_URL` / llaves AWS + región + tabla) pegadas **en el dashboard**,
nunca en git (`.env` ignorados). El micro docentes es Node nativo sin Express
(`npm start` → `server.js`, con `index.js` puente por si la plataforma arranca
con `node index.js`).

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
| `404` buscando cualquier nombre | Solo existen 10 por área Pokémon/Naruto y 3 docentes | Usa los listados en Datos |
| QR carga infinito | VM en NAT / firewall | `--tunnel` o adaptador puente |
| Expo Go avisa de SDK | Go más nuevo que el proyecto (54) | `npx expo upgrade` (cambia el pin de `AGENTS.md`) |
| DynamoDB `AccessDenied` en `us-east-1` | SCP de cuenta educativa lo bloquea | Usar `us-east-2` |
