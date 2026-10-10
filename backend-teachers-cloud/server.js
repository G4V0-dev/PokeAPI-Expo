/**
 * Microservicio cloud Docentes UNINPAHU (Node NATIVO + Swagger, SIN Express).
 * Solo usa node:http + node:url. Persistencia SOLO DynamoDB (db.js).
 *
 * SIN fallback en memoria: `teachers.seed.json` es SOLO respaldo semilla
 * para `npm run seed`. Sin llaves AWS o sin tabla, el micro responde 503
 * con mensaje claro (nunca sirve la semilla en vivo).
 *
 * Endpoints:
 *   GET    /                  -> info del servicio
 *   GET    /health            -> { ok, db, mode }
 *   GET    /teachers          -> [{ id, name, profession, headline, photo, profileUrl }]
 *   GET    /teachers?query=x  -> filtrado por nombre/profesion (query param)
 *   GET    /teachers/:query   -> detalle por id numerico o nombre (path param)
 *   POST   /teachers          -> crear (body JSON, id = max+1)
 *   PUT    /teachers/:id      -> reemplazo total por id numerico (body JSON)
 *   PATCH  /teachers/:id      -> actualizacion parcial por id numerico (body JSON)
 *   DELETE /teachers/:id      -> borra por id numerico
 *   GET    /openapi.json (+ /api-docs.json) -> spec Swagger JSON (OpenAPI 3.0)
 *   GET    /docs (+ /api-docs)  -> Swagger UI interactivo por CDN (paridad con poke-cloud /api-docs)
 *
 * Escrituras ABIERTAS sin auth por decision del proyecto (uso universitario).
 */
require('dotenv').config();
const http = require('node:http');
const { URL } = require('node:url');
const { createDynamoRepository } = require('./db');

const PORT = Number(process.env.PORT || 3103);
const TABLE_NAME = process.env.TABLE_NAME || 'teachers';
const AWS_REGION = process.env.AWS_REGION || 'us-east-2';
const HAS_AWS_KEYS = Boolean(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY);
const NO_DB_MESSAGE = 'Servicio no disponible: sin acceso a DynamoDB (revisa llaves AWS/tabla teachers).';

// --- Repositorio SOLO DynamoDB (sin memoria) ---
let repo = null;
let repoError = null;
async function initRepo() {
  if (!HAS_AWS_KEYS) {
    repo = null;
    repoError = 'sin llaves AWS (AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY)';
    console.log(`[teachers] ${repoError} -> responde 503, sin fallback.`);
    return;
  }
  try {
    const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
    const { DynamoDBDocumentClient, ScanCommand, GetCommand, PutCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb');
    const client = new DynamoDBClient({ region: AWS_REGION });
    const docClient = DynamoDBDocumentClient.from(client);
    const dynamo = createDynamoRepository({ docClient, tableName: TABLE_NAME, ScanCommand, GetCommand, PutCommand, DeleteCommand });
    await dynamo.health(); // valida conexion + tabla
    repo = dynamo;
    repoError = null;
    console.log(`[teachers] conectado a DynamoDB ${AWS_REGION}/${TABLE_NAME}.`);
  } catch (e) {
    repo = null;
    repoError = e.message;
    console.log(`[teachers] DynamoDB no disponible (${e.message}) -> responde 503, sin fallback.`);
  }
}

// --- Spec Swagger (OpenAPI 3.0) — nivel poke-cloud (Swagger UI interactivo) ---
function baseUrl(req) {
  if (process.env.RENDER_EXTERNAL_URL) return process.env.RENDER_EXTERNAL_URL;
  const host = req.headers.host || `localhost:${PORT}`;
  return `http://${host}`;
}

function serversFor(req) {
  const base = baseUrl(req);
  if (process.env.RENDER_EXTERNAL_URL) {
    return [
      { url: base, description: 'Producción (Render)' },
      { url: `http://localhost:${PORT}`, description: 'Local' },
    ];
  }
  return [{ url: base, description: 'Local' }];
}

function teacherInputSchema() {
  return {
    type: 'object',
    required: ['name', 'profession'],
    properties: {
      name: { type: 'string', example: 'Ada Lovelace' },
      profession: { type: 'string', example: 'Docente de Programación' },
      headline: { type: 'string', example: 'Pionera de la computación' },
      description: { type: 'string', example: 'Docente e investigadora...' },
      photo: { type: 'string', format: 'uri', example: 'https://ui-avatars.com/api/?name=Ada+Lovelace&background=D64545&color=fff' },
      profileUrl: { type: 'string', format: 'uri', example: 'https://www.linkedin.com/in/ada-lovelace/' },
      area: { type: 'string', example: 'Ingeniería de Software' },
      aliases: { type: 'array', items: { type: 'string' }, example: ['ada', 'lovelace'] },
    },
  };
}

function teacherSummarySchema() {
  return {
    type: 'object',
    required: ['id', 'name', 'profession'],
    properties: {
      id: { type: 'integer', example: 2 },
      name: { type: 'string', example: 'Leonardo Valenzuela Rodriguez' },
      profession: { type: 'string', example: 'Backend Engineer (.NET y Azure) | Docente universitario' },
      headline: { type: 'string', example: 'Backend Engineer con experiencia en .NET, Azure y microservicios.' },
      photo: { type: 'string', format: 'uri', example: 'https://ui-avatars.com/api/?name=Leonardo+Valenzuela+Rodriguez&background=D64545&color=fff&size=512' },
      profileUrl: { type: 'string', format: 'uri', example: 'https://www.linkedin.com/in/leonardo-valenzuela-rodriguez/' },
    },
  };
}

function teacherDetailSchema() {
  return {
    type: 'object',
    required: ['id', 'name', 'profession'],
    properties: {
      id: { type: 'integer', example: 1 },
      name: { type: 'string', example: 'Elfar Didier Morantes Sanchez' },
      profession: { type: 'string', example: 'Ingeniero Electrónico · Docente FullStack' },
      headline: { type: 'string', example: 'Ingeniero Electrónico, Especialista en Ingeniería de Software.' },
      description: { type: 'string', example: 'Desarrollador FullStack con énfasis en backend... Docente universitario.' },
      photo: { type: 'string', format: 'uri', example: 'https://unavatar.io/linkedin/elfar-didier-morantes-s%C3%A1nchez' },
      profileUrl: { type: 'string', format: 'uri', example: 'https://www.linkedin.com/in/elfar-didier-morantes-s%C3%A1nchez/' },
      area: { type: 'string', nullable: true, example: 'Ingeniería y Tecnologías de la Información' },
      order: { type: 'integer', nullable: true, example: 1 },
    },
  };
}

function errorSchema() {
  return {
    type: 'object',
    required: ['error'],
    properties: {
      error: { type: 'string', example: 'Docente no encontrado en la nube.' },
      detail: { type: 'string', example: 'Detalle técnico opcional (DynamoDB / validación).' },
    },
  };
}

function openApiSpec(req) {
  const TeacherInput = teacherInputSchema();
  const TeacherSummary = teacherSummarySchema();
  const TeacherDetail = teacherDetailSchema();
  const Error = errorSchema();
  return {
    openapi: '3.0.0',
    info: {
      title: 'Teachers Cloud — microservicio Docentes UNINPAHU (DynamoDB + CRUD)',
      version: '2.1.0',
      description:
        'Docentes UNINPAHU servidos **SOLO desde DynamoDB** (tabla `teachers`, región `us-east-2`).\n\n' +
        '- **Sin fallback en memoria:** sin llaves AWS o sin tabla responde `503`. La semilla `teachers.seed.json` es SOLO respaldo para `npm run seed`.\n' +
        '- **Escrituras abiertas sin auth** (uso universitario). Requieren permiso IAM (`PutItem` para POST/PUT/PATCH, `DeleteItem` para DELETE); sin él responden `403`.\n' +
        '- **Búsqueda flexible:** por ID numérico (`/teachers/2`), nombre exacto, alias (`/teachers/elfar`) o prefijo/contiene (`/teachers/leonardo`, `?query=leonardo`).\n' +
        '- **Docs:** esta página (`/docs`, alias `/api-docs`) + spec JSON (`/openapi.json`, alias `/api-docs.json`).',
      contact: { name: 'UNINPAHU — Facultad de Ingeniería y TI' },
    },
    servers: serversFor(req),
    tags: [
      { name: 'Salud', description: 'Estado del servicio y de DynamoDB.' },
      { name: 'Docentes', description: 'Lectura y CRUD de docentes. Lecturas por ID, nombre o alias.' },
      { name: 'Docs', description: 'Spec OpenAPI y página interactiva.' },
    ],
    paths: {
      '/': {
        get: {
          tags: ['Salud'],
          summary: 'Info del servicio',
          operationId: 'serviceInfo',
          responses: {
            200: {
              description: 'Info + modo de persistencia y rutas de docs.',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      service: { type: 'string', example: 'teachers-cloud' },
                      table: { type: 'string', example: 'teachers' },
                      region: { type: 'string', example: 'us-east-2' },
                      mode: { type: 'string', example: 'dynamodb' },
                      docs: { type: 'string', example: '/docs' },
                      spec: { type: 'string', example: '/openapi.json' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/health': {
        get: {
          tags: ['Salud'],
          summary: 'Salud del microservicio (+ DynamoDB)',
          description: 'Hace `Scan Limit=1` sobre la tabla. Sin BD responde `503` (nunca sirve semilla en vivo).',
          operationId: 'healthCheck',
          responses: {
            200: {
              description: 'OK — conectado a DynamoDB.',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      ok: { type: 'boolean', example: true },
                      db: { type: 'boolean', example: true },
                      mode: { type: 'string', example: 'dynamodb' },
                      count: { type: 'integer', nullable: true, example: 1 },
                    },
                  },
                },
              },
            },
            503: {
              description: NO_DB_MESSAGE,
              content: { 'application/json': { schema: Error } },
            },
          },
        },
      },
      '/teachers': {
        get: {
          tags: ['Docentes'],
          summary: 'Lista docentes (resumen)',
          description: 'Devuelve `[{ id, name, profession, headline, photo, profileUrl }]` ordenados por `order`. Con `?query=` filtra por nombre, profesión o alias (case-insensitive).',
          operationId: 'listTeachers',
          parameters: [
            {
              in: 'query',
              name: 'query',
              required: false,
              schema: { type: 'string' },
              example: 'leonardo',
              description: 'Filtra por nombre, profesión o alias. Vacío = trae todos.',
            },
          ],
          responses: {
            200: {
              description: 'Arreglo resumen.',
              content: { 'application/json': { schema: { type: 'array', items: TeacherSummary } } },
            },
            503: {
              description: NO_DB_MESSAGE,
              content: { 'application/json': { schema: Error } },
            },
          },
        },
        post: {
          tags: ['Docentes'],
          summary: 'Crea un docente (id = max+1)',
          description: 'Body JSON plano `{ name, profession, ... }` (también acepta `{ data: {...} }`). Exige `name` + `profession`. Genera `id = max(id)+1`, `order = max(order)+1`, `name_lower` y `seed_key` (slug) derivados.',
          operationId: 'createTeacher',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: TeacherInput,
                examples: {
                  minimo: {
                    summary: 'Mínimo válido',
                    value: { name: 'Ada Lovelace', profession: 'Docente de Programación' },
                  },
                  completo: {
                    summary: 'Completo',
                    value: {
                      name: 'Ada Lovelace',
                      profession: 'Docente de Programación',
                      headline: 'Pionera de la computación',
                      description: 'Docente e investigadora...',
                      photo: 'https://ui-avatars.com/api/?name=Ada+Lovelace&background=D64545&color=fff',
                      profileUrl: 'https://www.linkedin.com/in/ada-lovelace/',
                      area: 'Ingeniería de Software',
                      aliases: ['ada', 'lovelace'],
                    },
                  },
                },
              },
            },
          },
          responses: {
            201: {
              description: 'Detalle creado.',
              content: { 'application/json': { schema: TeacherDetail } },
            },
            400: { description: 'Falta name o profession / JSON inválido / body > 1MB.', content: { 'application/json': { schema: Error } } },
            403: { description: 'Rol IAM sin permiso de escritura (PutItem).', content: { 'application/json': { schema: Error } } },
            503: { description: NO_DB_MESSAGE, content: { 'application/json': { schema: Error } } },
          },
        },
      },
      '/teachers/{query}': {
        get: {
          tags: ['Docentes'],
          summary: 'Docente por ID o nombre',
          description: 'Path param flexible: ID numérico (`2`), nombre exacto (`Leonardo Valenzuela Rodriguez`), alias (`elfar`), prefijo (`leo`) o contiene (`valen`). Prioridad: ID → exacto/alias → startsWith → includes.',
          operationId: 'getTeacher',
          parameters: [
            {
              in: 'path',
              name: 'query',
              required: true,
              schema: { type: 'string' },
              examples: {
                porId: { summary: 'Por ID', value: '2' },
                porAlias: { summary: 'Por alias', value: 'elfar' },
                porNombre: { summary: 'Por nombre', value: 'leonardo' },
              },
              description: 'ID numérico o nombre/alias.',
            },
          ],
          responses: {
            200: {
              description: 'Detalle del docente.',
              content: { 'application/json': { schema: TeacherDetail } },
            },
            400: { description: 'Falta query.', content: { 'application/json': { schema: Error } } },
            404: { description: 'No existe en la nube.', content: { 'application/json': { schema: Error } } },
            503: { description: NO_DB_MESSAGE, content: { 'application/json': { schema: Error } } },
          },
        },
      },
      '/teachers/{id}': {
        put: {
          tags: ['Docentes'],
          summary: 'Reemplazo total por ID numérico',
          description: 'PUT reemplaza el item (conserva `order`). Exige `name` + `profession`. PUT/PATCH/DELETE SOLO por ID numérico (`/teachers/abc` → `400`).',
          operationId: 'replaceTeacher',
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' }, example: 4, description: 'ID numérico.' }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: TeacherInput,
                examples: {
                  reemplazo: {
                    summary: 'Reemplazo total',
                    value: { name: 'Ada Lovelace', profession: 'Docente de Programación', headline: 'Pionera', area: 'Ingeniería de Software' },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: 'Detalle reemplazado.', content: { 'application/json': { schema: TeacherDetail } } },
            400: { description: 'ID no numérico / falta name o profession.', content: { 'application/json': { schema: Error } } },
            404: { description: 'No existe ese ID.', content: { 'application/json': { schema: Error } } },
            403: { description: 'Rol IAM sin permiso de escritura (PutItem).', content: { 'application/json': { schema: Error } } },
            503: { description: NO_DB_MESSAGE, content: { 'application/json': { schema: Error } } },
          },
        },
        patch: {
          tags: ['Docentes'],
          summary: 'Actualización parcial por ID numérico',
          description: 'PATCH mezcla sobre el item existente. Exige al menos un campo editable; `name`/`profession` presentes no pueden quedar vacíos.',
          operationId: 'patchTeacher',
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' }, example: 4, description: 'ID numérico.' }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: TeacherInput.properties,
                  description: 'Al menos un campo editable.',
                  minProperties: 1,
                },
                examples: {
                  area: { summary: 'Cambiar área', value: { area: 'Ingeniería de Software' } },
                  foto: { summary: 'Fijar foto definitiva', value: { photo: 'https://uninpahu.edu.co/wp-content/uploads/foto.jpg' } },
                },
              },
            },
          },
          responses: {
            200: { description: 'Detalle actualizado.', content: { 'application/json': { schema: TeacherDetail } } },
            400: { description: 'ID no numérico / PATCH sin campos / campo vacío.', content: { 'application/json': { schema: Error } } },
            404: { description: 'No existe ese ID.', content: { 'application/json': { schema: Error } } },
            403: { description: 'Rol IAM sin permiso de escritura (PutItem).', content: { 'application/json': { schema: Error } } },
            503: { description: NO_DB_MESSAGE, content: { 'application/json': { schema: Error } } },
          },
        },
        delete: {
          tags: ['Docentes'],
          summary: 'Borra por ID numérico',
          description: 'Devuelve el detalle borrado.',
          operationId: 'deleteTeacher',
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' }, example: 4, description: 'ID numérico.' }],
          responses: {
            200: { description: 'Detalle borrado.', content: { 'application/json': { schema: TeacherDetail } } },
            400: { description: 'ID no numérico.', content: { 'application/json': { schema: Error } } },
            404: { description: 'No existe ese ID.', content: { 'application/json': { schema: Error } } },
            403: { description: 'Rol IAM sin permiso de borrado (DeleteItem).', content: { 'application/json': { schema: Error } } },
            503: { description: NO_DB_MESSAGE, content: { 'application/json': { schema: Error } } },
          },
        },
      },
      '/openapi.json': {
        get: {
          tags: ['Docs'],
          summary: 'Spec OpenAPI JSON',
          operationId: 'openApiJson',
          responses: { 200: { description: 'Spec OpenAPI 3.0.' } },
        },
      },
    },
    components: {
      schemas: {
        TeacherSummary,
        TeacherDetail,
        TeacherInput,
        TeacherPatch: {
          type: 'object',
          properties: TeacherInput.properties,
          description: 'Al menos un campo editable.',
          minProperties: 1,
        },
        Error,
      },
    },
  };
}

// --- Docs interactivas estilo poke-cloud (/api-docs): Swagger UI por CDN, SIN Express ---
// Se mantiene Node nativo (node:http): /docs sirve este HTML que carga
// swagger-ui-dist desde unpkg y apunta a /openapi.json. Sin dependencias nuevas.
function docsHtml() {
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Teachers Cloud — Docs (Swagger UI)</title>
<link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.17.14/swagger-ui.css"/>
<style>
body{margin:0;font-family:system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif;background:#fafafa;color:#222}
.topbar-custom{background:#D64545;color:#fff;padding:14px 20px}
.topbar-custom h1{margin:0;font-size:18px}
.topbar-custom p{margin:4px 0 0;font-size:13px;opacity:.95}
.topbar-custom a{color:#fff;font-weight:600}
.topbar-custom code{background:rgba(255,255,255,.2);padding:1px 6px;border-radius:6px}
.swagger-ui .topbar{display:none}
.hint{max-width:960px;margin:12px auto;padding:10px 16px;font-size:13px;background:#FFF7ED;border:1px solid #FDBA74;border-radius:10px;color:#7C2D12}
#swagger-ui{max-width:960px;margin:0 auto;padding-bottom:40px}
</style></head><body>
<div class="topbar-custom"><h1>Teachers Cloud — Docentes UNINPAHU (CRUD + DynamoDB)</h1>
<p>Interactiva como <b>poke-cloud /api-docs</b> · Spec: <a href="/openapi.json">/openapi.json</a> · Alias: <code>/api-docs</code> / <code>/api-docs.json</code> · Sin fallback: sin DynamoDB responde <code>503</code> · Escrituras abiertas sin auth (uso universitario).</p></div>
<div class="hint"><b>Cómo probar:</b> expande <code>GET /teachers</code> → <i>Try it out</i> → <i>Execute</i>. Detalle por ID (<code>/teachers/2</code>) o alias (<code>/teachers/elfar</code>). Para crear: <code>POST /teachers</code> con <code>{"name":"Ada Lovelace","profession":"Docente"}</code>. PUT/PATCH/DELETE solo por ID numérico.</div>
<div id="swagger-ui"></div>
<script src="https://unpkg.com/swagger-ui-dist@5.17.14/swagger-ui-bundle.js"></script>
<script src="https://unpkg.com/swagger-ui-dist@5.17.14/swagger-ui-standalone-preset.js"></script>
<script>window.onload = function(){ SwaggerUIBundle({ url: "./openapi.json", dom_id: "#swagger-ui", deepLinking: true, presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset], layout: "StandaloneLayout", tryItOutEnabled: true }); };</script>
</body></html>`;
}

// --- Helpers HTTP ---
function sendJson(res, status, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(body);
}

function sendHtml(res, html) {
  res.writeHead(200, {
    'Content-Type': 'text/html; charset=utf-8',
    'Content-Length': Buffer.byteLength(html),
    'Access-Control-Allow-Origin': '*',
  });
  res.end(html);
}

function requireRepo(res) {
  if (repo) return true;
  sendJson(res, 503, { error: NO_DB_MESSAGE, detail: repoError || 'DynamoDB no configurado' });
  return false;
}

// Errores de escritura: un 403 claro cuando IAM niega la accion
// (ej. falta dynamodb:DeleteItem), en vez del 500 generico.
function sendWriteError(res, e) {
  const msg = String((e && e.message) || '');
  if (/not authorized|AccessDenied|is not authorized/i.test(msg)) {
    sendJson(res, 403, {
      error: 'La nube denegó la escritura: el rol IAM no tiene permiso sobre la tabla teachers (revisa DeleteItem/PutItem).',
      detail: msg,
    });
    return;
  }
  sendJson(res, (e && e.status) || 500, { error: msg || 'Error interno' });
}

function readBody(req, limit = 1024 * 1024) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', (c) => {
      size += c.length;
      if (size > limit) {
        reject(Object.assign(new Error('Body demasiado grande (max 1MB).'), { status: 413 }));
        req.destroy();
        return;
      }
      chunks.push(c);
    });
    req.on('end', () => {
      if (chunks.length === 0) {
        reject(Object.assign(new Error('Falta body JSON.'), { status: 400 }));
        return;
      }
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
      } catch {
        reject(Object.assign(new Error('Body JSON invalido.'), { status: 400 }));
      }
    });
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === 'OPTIONS') {
      res.writeHead(204, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      });
      res.end();
      return;
    }
    const u = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    const path = u.pathname.replace(/\/+$/, '') || '/';

    if (path === '/') {
      sendJson(res, 200, {
        service: 'teachers-cloud',
        table: HAS_AWS_KEYS ? TABLE_NAME : 'unavailable',
        region: AWS_REGION,
        mode: repo ? repo.mode : 'unavailable',
        docs: '/docs',
        spec: '/openapi.json',
      });
      return;
    }
    if (path === '/health') {
      if (!repo) {
        sendJson(res, 503, { ok: false, db: false, mode: 'unavailable', error: NO_DB_MESSAGE, detail: repoError });
        return;
      }
      try {
        const h = await repo.health();
        sendJson(res, 200, h);
      } catch (e) {
        sendJson(res, 503, { ok: false, db: false, mode: 'unavailable', error: NO_DB_MESSAGE, detail: e.message });
      }
      return;
    }
    if (path === '/teachers') {
      if (req.method === 'GET') {
        if (!requireRepo(res)) return;
        const list = await repo.listTeachers(u.searchParams.get('query') || '');
        sendJson(res, 200, list);
        return;
      }
      if (req.method === 'POST') {
        if (!requireRepo(res)) return;
        try {
          const body = await readBody(req);
          const created = await repo.createTeacher(body);
          sendJson(res, 201, created);
        } catch (e) {
          sendWriteError(res, e);
        }
        return;
      }
      sendJson(res, 405, { error: 'Metodo no permitido. Usa GET o POST en /teachers.' });
      return;
    }
    if (path.startsWith('/teachers/')) {
      const query = decodeURIComponent(path.slice('/teachers/'.length)).trim();
      if (!query) {
        sendJson(res, 400, { error: 'Falta query: usa /teachers/2 o /teachers/leonardo' });
        return;
      }
      if (req.method === 'GET') {
        if (!requireRepo(res)) return;
        const item = await repo.getTeacher(query);
        if (!item) {
          sendJson(res, 404, { error: 'Docente no encontrado en la nube.' });
          return;
        }
        sendJson(res, 200, item);
        return;
      }
      // Escrituras solo por ID numerico.
      if (!/^\d+$/.test(query)) {
        sendJson(res, 400, { error: 'PUT/PATCH/DELETE solo por ID numerico: /teachers/4' });
        return;
      }
      if (req.method === 'PUT' || req.method === 'PATCH') {
        if (!requireRepo(res)) return;
        try {
          const body = await readBody(req);
          const updated = req.method === 'PUT'
            ? await repo.updateTeacher(query, body)
            : await repo.patchTeacher(query, body);
          if (!updated) {
            sendJson(res, 404, { error: 'Docente no encontrado en la nube.' });
            return;
          }
          sendJson(res, 200, updated);
        } catch (e) {
          sendWriteError(res, e);
        }
        return;
      }
      if (req.method === 'DELETE') {
        if (!requireRepo(res)) return;
        try {
          const deleted = await repo.deleteTeacher(query);
          if (!deleted) {
            sendJson(res, 404, { error: 'Docente no encontrado en la nube.' });
            return;
          }
          sendJson(res, 200, deleted);
        } catch (e) {
          sendWriteError(res, e);
        }
        return;
      }
      sendJson(res, 405, { error: 'Metodo no permitido. Usa GET, PUT, PATCH o DELETE.' });
      return;
    }
    if (path === '/openapi.json' || path === '/api-docs.json') {
      sendJson(res, 200, openApiSpec(req));
      return;
    }
    if (path === '/docs' || path === '/api-docs') {
      sendHtml(res, docsHtml());
      return;
    }
    sendJson(res, 404, { error: 'Ruta no encontrada. Ver /docs.' });
  } catch (e) {
    sendJson(res, 500, { error: 'Error interno', detail: e.message });
  }
});

initRepo().then(() => {
  server.listen(PORT, () => {
    console.log(`Teachers cloud en http://localhost:${PORT} -> docs en /docs (modo ${repo ? repo.mode : 'unavailable'})`);
  });
});
