# Funcionamiento en mobile — Poké Explorer

**Fecha**: 2026-09-26 · **Estado**: ✅ verificado en Expo Go (Android, LAN)

## 1. Arranque (2 terminales)

```bash
# Terminal 1 — microservicio
cd backend && npm start
# Microservicio PokeAPI en http://localhost:3001 -> GET /consultaPokemon?query=pikachu

# Terminal 2 — app (Node 22, CLI local)
./node_modules/.bin/expo start --clear
# Web Bundled 2121ms index.js (316 modules)
```

> [imagen: terminal del micro corriendo]

> [imagen: terminal de Expo con QR]

## 2. Uso en el teléfono

1. Escanear el QR con Expo Go (misma red que la MV/PC).
2. Buscar por **nombre o número**: `pikachu`, `25`, `025`.
3. Tab **Galería**: arte oficial + sprites Normal/Shiny + anterior/siguiente.
4. Tab **Datos**: altura, peso, 6 stats, tipos, habilidad y todos los movimientos.

> [imagen: pantalla de búsqueda]

> [imagen: tab Galería con las 3 imágenes]

> [imagen: tab Datos]

## 3. Comprobación del microservicio

```bash
curl http://localhost:3001/health
# {"ok":true}

curl "http://localhost:3001/consultaPokemon?query=pikachu"
# id 25 · sprites {official, normal, shiny} · stats.total 320 · 109 moves
```

## 4. Error: microservicio inalcanzable

Si el micro está apagado o el teléfono no lo alcanza, la búsqueda muestra:

```
No se alcanzó el microservicio de búsqueda (http://192.168.20.144:3001).
```

> [imagen: pantalla con el error]

| Causa | Fix |
|---|---|
| Micro apagado (`ERR_CONNECTION_REFUSED`) | `cd backend && npm start`, verificar `/health` |
| `.env.development` con `localhost` | Poner la IP LAN de la MV y reiniciar Expo con `--clear` (el env se incrusta al arrancar) |

## Estado final

- ✅ Búsqueda por nombre o ID, tabs Galería/Datos, 4 estados (loading/error/empty/content)
- ✅ Backend + front verificados; repo: https://github.com/G4V0-dev/PokeAPI-Expo
