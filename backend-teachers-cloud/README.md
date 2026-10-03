# Teachers Cloud — Docentes UNINPAHU (Node nativo + DynamoDB)

Microservicio mínimo, **sin Express ni frameworks**: solo `node:http` + `node:url`.
Conexión **agnóstica** (`db.js`): el server solo usa `{ health, listTeachers, getTeacher }`.
Con llaves AWS usa DynamoDB; sin llaves usa memoria con el mismo seed (dev local).

## Endpoints (solo path/query params, sin body)

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/` | Info servicio |
| GET | `/health` | Salud + DB |
| GET | `/teachers` | Lista resumen (3) |
| GET | `/teachers?query=lotus` | Filtrado por query param |
| GET | `/teachers/:query` | Detalle por ID (`2`) o nombre/alias (`lotus`, `elfar`, `javier`) |
| GET | `/openapi.json` | Spec Swagger JSON |
| GET | `/docs` | Documentación mínima (HTML sin dependencias) |

```bash
npm install
npm run seed   # requiere AWS keys en .env (crea tabla teachers + 3 items)
npm start      # http://localhost:3103 -> /docs
curl http://localhost:3103/teachers
curl "http://localhost:3103/teachers?query=javier"
curl http://localhost:3103/teachers/2
```

## DynamoDB

- Región: `us-east-2`, tabla: `teachers`, PK numérica `id`.
- Item: `{ id, name_lower, aliases[], order, seed_key, data: { id, name, profession, headline, description, photo, profileUrl, area } }`.
- 3 docentes curados desde info pública LinkedIn/uninpahu.edu.co/p4s.co (ver `teachers.data.js`).

## Fotos

LinkedIn responde `999` al scraping sin sesión, por eso `photo` se resuelve
en vivo vía `unavatar.io/linkedin/<vanity>` (proxy público, verificado):
Elfar y Javier traen foto real; **Lotus no expone foto pública** (responde
silueta) y queda con placeholder de iniciales hasta pegar su URL real.
Para fijar una foto definitiva: reemplazar `photo` en `teachers.data.js`
(S3/Cloudinary o URL directa) y re-ejecutar `npm run seed` (no requiere
redesplegar: el dato vive en DynamoDB).

## Render

`render.yaml` con `rootDir: backend-teachers-cloud`, `healthCheckPath: /health`.
Pegar `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` en el dashboard (sync: false).
Front lo consume con `EXPO_PUBLIC_TEACHERS_API_URL`.
