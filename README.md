# PokeAPI-Expo · Poké Explorer

App móvil Expo (SDK 54) + microservicio Node propio. El front **nunca** llama a la
PokeAPI pública: pide al microservicio qué Pokémon buscar (`nombre o ID`) y este
consume `pokeapi.co`, cura la respuesta y devuelve JSON limpio.

Además incluye un **Asistente IA** multi-proveedor (Gemini/OpenAI/DeepSeek) que
consulta los micros locales de Pokémon y Naruto con function calling, y un panel
de **Ajustes** para elegir el timeout del backend (20/40/80/160 s) y el proveedor
de IA. Los parámetros viven en memoria (solo sesión).

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
| Backend | Node 22 + `backend/node_modules`, `backend-naruto/node_modules` y `backend-ai/node_modules` instalados |
| API keys IA | opcionales para arrancar: `backend-ai/.env` con las de Gemini/OpenAI/DeepSeek que vayas a usar |

## Instalación

```bash
# 1. Node correcto
export NVM_DIR="$HOME/.config/nvm"; . "$NVM_DIR/nvm.sh"; nvm use 22

# 2. Dependencias del front
npm install

# 3. Dependencias de los micros Pokémon y Naruto
cd backend && npm install && cd ..
cd backend-naruto && npm install && cd ..

# 4. Dependencias del asistente IA (opcional si no usarás el chat)
cd backend-ai && npm install && cd ..
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

En LAN cambia también `EXPO_PUBLIC_NARUTO_API_URL` (3002) y `EXPO_PUBLIC_AI_API_URL`
(3004) a la misma IP. Para el asistente, copia `backend-ai/.env.example` a
`backend-ai/.env` y completa solo las API keys que tengas; el micro arranca sin
keys y `/chat` responde `503` con un mensaje claro para el proveedor sin configurar.

## Cómo correrlo (4 procesos)

```bash
# Terminal 1 — microservicio (puerto 3001)
cd backend && npm start
curl http://localhost:3001/health  # → {"ok":true}

# Terminal 1b — microservicio Naruto (proceso aparte, puerto 3002)
cd backend-naruto && npm start
curl "http://localhost:3002/consultaNaruto?query=sasuke"  # → id 1307

# Terminal 1c — asistente IA multi-proveedor (puerto 3004)
cd backend-ai && npm start
curl http://localhost:3004/health  # → proveedores configurados

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
6. **Asistente IA** (FAB ✨): chat con preguntas sobre Pokémon y Naruto. El backend elige Gemini/OpenAI/DeepSeek según el ajuste activo.
7. **Ajustes** (FAB ⚙): timeout del backend `20/40/80/160 s` (default `40`, aplica a Pokémon, Naruto e IA) y proveedor de IA. Solo sesión: al reiniciar vuelven `40 s` y Gemini.

## Estructura

```
App.js                  Entrada: Providers + header + 4 estados + tabs + FABs IA/Ajustes
index.js                registerRootComponent
theme/tokens.js         Paleta (rojo fandom #D64545, amber #FFC83D) y radios
services/http.js        Timeout configurable + cancelación (AbortController)
services/pokemonService.js  fetch al micro (sin axios) + ApiError
services/narutoService.js   fetch al micro Naruto + vecinos del catálogo
services/aiService.js       fetch al micro IA con proveedor + timeout
context/SettingsContext.js  timeoutMs + aiProvider (solo sesión)
context/PokemonContext.js   Estado global: datos, loading/error/empty, tabs, search/next/prev
context/NarutoContext.js    Espejo con prevId/nextId
context/AssistantContext.js Hilo local del chat + envío al micro IA
components/
  SearchBar.js  · BottomTabs.js  · GalleryScreen.js (3 imágenes)
  DataScreen.js (datos) · StatBar.js · EmptyState.js
  AssistantFab.js · AssistantModal.js · SettingsFab.js · SettingsModal.js
backend/
  server.js     Microservicio: /consultaPokemon + /listaPokemon + /health
backend-naruto/
  server.js     Microservicio: /consultaNaruto + /listaNaruto + /health
backend-ai/
  server.js     Asistente IA: Gemini/OpenAI/DeepSeek + function calling
```

## API de los microservicios

### Micro Pokémon (`:3001`)

| Método | Descripción |
|---|---|
| `GET /consultaPokemon?query=pikachu` | Busca por nombre o ID (`?nombre=` y `/consultaPokemon/:query` son alias) |
| `GET /listaPokemon?limit=25` | Resumen id/nombre para las herramientas del asistente IA |
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

### Micro Naruto (`:3002`)

| Método | Descripción |
|---|---|
| `GET /consultaNaruto?query=sasuke` | Personaje por nombre o ID + `prevId`/`nextId` |
| `GET /listaNaruto?limit=25` | Resumen id/nombre/clan/aldeas para el asistente |
| `GET /health` | `{"ok":true}` |

### Asistente IA (`:3004`)

| Método | Descripción |
|---|---|
| `POST /chat` | `{"message":"...","provider":"gemini\|openai\|deepseek","timeoutMs":40000}` → `{reply, provider, model}` |
| `GET /health` | Proveedores y modelos configurados (`configured: true/false`) |
| `GET /api-docs` | Swagger UI del micro |

Sin API key del proveedor elegido, `/chat` devuelve `503` con el nombre de la
variable faltante (`GEMINI_API_KEY`, `OPENAI_API_KEY` o `DEEPSEEK_API_KEY`). Si se
agota el `timeoutMs`, devuelve `504`.

## Notas de red / dispositivo físico

- En VM con **NAT** (`10.0.2.x`) el teléfono no llega: usa **túnel** o pasa la VM a
  **Adaptador puente** (IP `192.168.x.x`) + `ufw allow 8081/tcp 3001/tcp 3002/tcp 3004/tcp`.
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
| `ERR_CONNECTION_REFUSED :3004` / chat sin respuesta | `backend-ai` apagado | `cd backend-ai && npm start` |
| Chat responde `503` | falta la API key del proveedor elegido | agregar `*_API_KEY` en `backend-ai/.env` + reiniciar |
| Chat responde `504` | se agotó el timeout elegido | subir a 80/160 s en Ajustes o reintentar |
| *Network request failed* solo en teléfono | env con `localhost` o Expo no reiniciado tras cambiarlo | IP LAN + `start --clear` |
| QR carga infinito | VM en NAT / firewall | `--tunnel` o puente + puertos |
| Expo Go avisa de SDK | Go más nuevo que el proyecto (54) | `npx expo upgrade` (cambia el pin de `AGENTS.md`) |
