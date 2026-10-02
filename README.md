# PokeAPI-Expo · Poké Explorer

App móvil Expo (SDK 54) + microservicio Node propio. El front **nunca** llama a la
PokeAPI pública: pide al microservicio qué Pokémon buscar (`nombre o ID`) y este
consume `pokeapi.co`, cura la respuesta y devuelve JSON limpio.

```
┌────────┐   GET /consultaPokemon?query=pikachu   ┌──────────┐   GET /pokemon/:q   ┌──────────┐
│  Front │  ───────────────────────────────────▶  │  Node    │  ────────────────▶  │ pokeapi  │
│ (Expo) │                                        │ /consulta│                     │  .co     │
│        │  ◀───────────────────────────────────  │ Pokemon  │  ◀────────────────  │ (nube)   │
└────────┘            JSON curado                 └──────────┘      JSON crudo      └──────────┘
```

Diseño generado en Stitch (MOBILE) y convertido a React Native con `StyleSheet.create`.

## Requisitos

| Qué | Versión |
|---|---|
| Node.js | **22 LTS** (`nvm install 22 && nvm use 22`). Node 26 rompe Metro (`ERR_PACKAGE_PATH_NOT_EXPORTED ./rn-get-polyfills`) |
| Gestor de paquetes | **npm** (hay `package-lock.json`; no usar pnpm: resuelve un CLI global 57 incompatible) |
| Expo CLI | local del proyecto (`./node_modules/.bin/expo`, 54.x) |
| Expo Go en el teléfono | compatible con **SDK 54** |
| Backend | Node 22 + `backend/node_modules` instalados |

## Instalación

```bash
# 1. Node correcto
export NVM_DIR="$HOME/.config/nvm"; . "$NVM_DIR/nvm.sh"; nvm use 22

# 2. Dependencias del front
npm install

# 3. Dependencias del microservicio
cd backend && npm install && cd ..
```

## Configuración

`EXPO_PUBLIC_API_URL` dice al front dónde está el micro (se incrusta al arrancar Expo:
cámbiala con Expo detenido).

```bash
# .env.development — emulador / mismo PC
EXPO_PUBLIC_API_URL=http://localhost:3001

# .env.development — teléfono físico en LAN (IP de ESTA máquina)
EXPO_PUBLIC_API_URL=http://192.168.20.144:3001
```

## Cómo correrlo (2 terminales)

```bash
# Terminal 1 — microservicio (puerto 3001)
cd backend && npm start
curl http://localhost:3001/health  # → {"ok":true}

# Terminal 1b — microservicio Naruto (proceso aparte, puerto 3002)
cd backend-naruto && npm start
curl "http://localhost:3002/consultaNaruto?query=sasuke"  # → id 1307

# Terminal 2 — app Expo
./node_modules/.bin/expo start --clear        # LAN / emulador
./node_modules/.bin/expo start --tunnel       # si el teléfono no alcanza tu red (pide @expo/ngrok)
```

Luego escanea el QR con Expo Go. `npm run web` también sirve (`expo start --web`).

## Uso

1. Busca por **nombre o número**: `pikachu`, `25`, `025` (normaliza ceros), `150`.
   En Naruto: `sasuke`, `1307`, `naruto`.
2. **4 tabs abajo**: Galería/Datos Pokémon + N-Galería/N-Datos Naruto.
3. **Galería Pokémon** (tab 1): arte oficial + sprites Normal/Shiny (= 3 imágenes) + anterior/siguiente.
4. **Datos Pokémon** (tab 2): altura, peso, 6 stats con barras, tipos, habilidad y **todos** los movimientos.
5. **N-Galería**: imágenes + nombre + clan/aldea + jutsu insignia + anterior/siguiente (por vecinos del catálogo, los IDs no son secuenciales). **N-Datos**: físico, debut, naturalezas, jutsus, familia.

## Estructura

```
App.js                  Entrada: Provider + header + 4 estados + tabs
index.js                registerRootComponent
theme/tokens.js         Paleta (rojo fandom #D64545, amber #FFC83D) y radios
services/pokemonService.js  fetch al micro (sin axios) + ApiError
context/PokemonContext.js   Estado global: datos, loading/error/empty, tabs, search/next/prev
components/
  SearchBar.js  · BottomTabs.js  · GalleryScreen.js (3 imágenes)
  DataScreen.js (datos) · StatBar.js · EmptyState.js
backend/
  server.js     Microservicio: /consultaPokemon + /health (+ curaduría toCurated)
  package.json
```

## API del microservicio

| Método | Descripción |
|---|---|
| `GET /consultaPokemon?query=pikachu` | Busca por nombre o ID (`?nombre=` y `/consultaPokemon/:query` son alias) |
| `GET /health` | `{"ok":true}` |

Respuesta curada (ej. `?query=25`):

```json
{
  "id": 25, "name": "pikachu", "heightM": 0.4, "weightKg": 6,
  "sprites": { "official": "https://…", "normal": "https://…", "shiny": "https://…" },
  "types": ["electric"], "abilities": ["static", "lightning-rod"],
  "stats": { "hp": 35, "attack": 55, "defense": 40, "spAtk": 50, "spDef": 50, "speed": 90, "total": 320 },
  "moves": ["mega-punch", "pay-day", "thunder-punch", "…"]
}
```

Errores: `400` sin query · `404` Pokémon inexistente (`{error: "…"}`).

## Notas de red / dispositivo físico

- En VM con **NAT** (`10.0.2.x`) el teléfono no llega: usa **túnel** o pasa la VM a
  **Adaptador puente** (IP `192.168.x.x`) + `ufw allow 8081/tcp 3001/tcp`.
- `localhost` en el teléfono = el teléfono: en físico usa siempre la IP LAN.
- Android 9+ puede bloquear `http://` (cleartext) con *Network request failed*:
  alternativa por USB → `adb reverse tcp:3001 tcp:3001` + URL `localhost`.
- El túnel expone Metro sin auth: úsalo en sesiones cortas, no compartas la URL y
  sin secretos en `EXPO_PUBLIC_*`.

## Problemas conocidos

| Síntoma | Causa | Fix |
|---|---|---|
| `ERR_PACKAGE_PATH_NOT_EXPORTED ./rn-get-polyfills` | Node 26 o CLI 57 de pnpm | Node 22 + `./node_modules/.bin/expo` + `npm install` |
| `ERR_CONNECTION_REFUSED :3001` | micro apagado | `cd backend && npm start` |
| *Network request failed* solo en teléfono | env con `localhost` o Expo no reiniciado tras cambiarlo | IP LAN + `start --clear` |
| QR carga infinito | VM en NAT / firewall | `--tunnel` o puente + puertos |
| Expo Go avisa de SDK | Go más nuevo que el proyecto (54) | `npx expo upgrade` (cambia el pin de `AGENTS.md`) |

## Nube pública (rama `feature/escalamiento-cloud-dbs`)

El front ya NO usa los micros locales: apunta solo a Render (Swagger incluido).

| Micro | URL pública | Swagger | Fuente de datos |
|---|---|---|---|
| Pokémon (Node) | `https://pokeapi-expo.onrender.com` | `/api-docs` | Supabase Postgres (tabla `pokemons`, 10 clásicos) |
| Anime (Python) | `https://pokeapi-expo-naruto.onrender.com` | `/docs` | DynamoDB `us-east-2` (tabla `anime_characters`, 10 de Naruto) |

```bash
# .env.development — solo nube (vale para emulador y teléfono: es https público)
EXPO_PUBLIC_API_URL=https://pokeapi-expo.onrender.com
EXPO_PUBLIC_NARUTO_API_URL=https://pokeapi-expo-naruto.onrender.com
```

Endpoints cloud: `GET /pokemons`, `GET /pokemons/:query`, `GET /characters`,
`GET /characters/:query`, `GET /health` (verifica DB: `{"ok":true,"db":true}`).
Solo existen 10 por área; fuera de ellos responde `404`. Anterior/siguiente navega
dentro de esos 10 (Pokémon por lista, Naruto por `prevId`/`nextId`).

> Render gratis duerme sin tráfico: la primera búsqueda puede tardar ~50s
> (la app lo muestra como loading; reintenta si expira). Secretos (`DATABASE_URL`,
> llaves AWS) solo en `.env` ignorados y env vars de Render, nunca en git.
> Micros locales (`backend/`, `backend-naruto/`) quedan como respaldo de desarrollo.
