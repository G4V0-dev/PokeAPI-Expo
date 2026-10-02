# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v54.0.0/ before writing any code.

# Convenciones del proyecto (PokeAPI-Expo)

- **SDK 54 pineado**: `expo ~54.0.36`, `react 19.1.0`, `react-native 0.81.5`.
- **Node 22 LTS** (`nvm use 22`). Node 26 rompe Metro (`rn-get-polyfills`).
- **npm, no pnpm**: hay `package-lock.json`. Usar el CLI local
  `./node_modules/.bin/expo` (el global de pnpm resuelve CLI 57 incompatible).
- **Sin Expo Router**: app existente con `index.js` → `App.js`. No crear `app/`.
- **JS con `StyleSheet.create`** (no migrar a TS sin pedirlo).
- **Front nunca llama a APIs públicas**: todo pasa por los micros cloud en Render
  (sin fallback local). Pokémon → `GET /pokemons/:query` (`backend-poke-cloud/`,
  Supabase, Swagger `/api-docs`, `EXPO_PUBLIC_API_URL`). Anime →
  `GET /characters/:query` (`backend-anime-cloud/`, DynamoDB `us-east-2`, Swagger
  `/docs`, `EXPO_PUBLIC_NARUTO_API_URL`, alias `pain`→Nagato).
- **Solo 10 por área**: fuera de ellos la nube da `404`. Anterior/siguiente Pokémon
  por lista de la nube (`getPokemonIds`); Naruto por `prevId`/`nextId` del payload.
- **Micros locales legacy** (`backend/` :3001, `backend-naruto/` :3002): solo respaldo
  de desarrollo, el front ya no los usa.
- **Estado global**: `context/PokemonContext.js` (`usePokemon`). Galería = 3 imágenes,
  Datos = resto. 4 estados: loading / error / empty / content.
- **Tokens**: `theme/tokens.js` (rojo fandom `#D64545`). Sin NativeWind salvo pedido explícito.
- **Cloud (rama escalamiento)**: el front apunta SOLO a Render (sin fallback local).
  Pokémon → `https://pokeapi-expo.onrender.com/pokemons/:query` (`backend-poke-cloud/`,
  Supabase). Anime → `https://pokeapi-expo-naruto.onrender.com/characters/:query`
  (`backend-anime-cloud/`, DynamoDB `us-east-2`). Anterior/siguiente Pokémon por lista
  de la nube (`getPokemonIds`); Naruto por `prevId`/`nextId` del payload.
- Tras cambiar `.env*`, reiniciar Expo (`--clear`): el env se incrusta al arrancar.
