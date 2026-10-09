# Teachers Cloud — Docentes UNINPAHU (Node nativo + DynamoDB + CRUD)

Microservicio mínimo, **sin Express ni frameworks**: solo `node:http` + `node:url`.
Persistencia **SOLO DynamoDB** (`db.js`): el server solo usa
`{ health, listTeachers, getTeacher, createTeacher, updateTeacher, patchTeacher, deleteTeacher }`.

**Sin fallback en memoria**: `teachers.seed.json` es SOLO respaldo semilla
para `npm run seed`. Sin llaves AWS o sin tabla, el micro responde
`503 { error: "Servicio no disponible: sin acceso a DynamoDB..." }`.

## Endpoints

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/` | Info servicio (+ `mode`) |
| GET | `/health` | Salud + DB (`503` sin BD) |
| GET | `/teachers` | Lista resumen |
| GET | `/teachers?query=x` | Filtrado por query param (nombre/profesión) |
| GET | `/teachers/:query` | Detalle por ID (`2`) o nombre/alias |
| POST | `/teachers` | Crea (body JSON, exige `name`+`profession`, id = max+1) → `201` |
| PUT | `/teachers/:id` | Reemplazo total por ID numérico (body JSON) |
| PATCH | `/teachers/:id` | Parcial por ID numérico (body JSON, ≥1 campo) |
| DELETE | `/teachers/:id` | Borra por ID numérico |
| GET | `/openapi.json` | Spec Swagger JSON (CRUD documentado) |
| GET | `/docs` | Documentación mínima (HTML sin dependencias) |

Escrituras **abiertas sin auth** por decisión del proyecto (uso universitario).

```bash
npm install
npm run seed   # requiere AWS keys en .env (crea tabla teachers + carga teachers.seed.json)
npm start      # http://localhost:3103 -> /docs (sin llaves => 503, sin fallback)
curl http://localhost:3103/teachers
curl "http://localhost:3103/teachers?query=leonardo"
curl http://localhost:3103/teachers/2
curl -X POST http://localhost:3103/teachers -H "Content-Type: application/json" -d '{"name":"Ada Lovelace","profession":"Docente"}'
curl -X PUT http://localhost:3103/teachers/4 -H "Content-Type: application/json" -d '{"name":"Ada Lovelace","profession":"Docente de Programacion"}'
curl -X PATCH http://localhost:3103/teachers/4 -H "Content-Type: application/json" -d '{"area":"Ingenieria"}'
curl -X DELETE http://localhost:3103/teachers/4
```

## DynamoDB

- Región: `us-east-2`, tabla: `teachers`, PK numérica `id`.
- Item: `{ id, name_lower, aliases[], order, seed_key, data: { id, name, profession, headline, description, photo, profileUrl, area } }`.
- `POST` genera `id = max(id)+1`, `order = max(order)+1`, `name_lower` y `seed_key` (slug) derivados.
- `PUT` exige `name`+`profession` (reemplazo); `PATCH` mezcla parcial; `DELETE` devuelve el borrado.
- Semilla inicial en `teachers.seed.json` (mismo esquema; antes `teachers.data.js`, eliminado).

## Fotos

LinkedIn responde `999` al scraping sin sesión, por eso las fotos se
resuelven sin scraping: Elfar en vivo vía `unavatar.io/linkedin/<vanity>`;
el resto usa `ui-avatars.com` temporal hasta pegar URL real.
Para fijar una foto definitiva: editar `photo` en `teachers.seed.json`
para futuras cargas, o `PATCH /teachers/:id` sobre el dato vivo en DynamoDB
(no requiere redesplegar: el dato vive en DynamoDB).

## Render

`render.yaml` con `rootDir: backend-teachers-cloud`, `healthCheckPath: /health`.
Pegar `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` en el dashboard (sync: false).
Sin ellas el servicio queda en `503`, nunca en memoria.
Front lo consume con `EXPO_PUBLIC_TEACHERS_API_URL`
(`services/teachersService.js`: `getTeachers/getTeacher/createTeacher/updateTeacher/patchTeacher/deleteTeacher`).
