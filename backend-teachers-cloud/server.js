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
 *   GET    /openapi.json      -> spec Swagger JSON
 *   GET    /docs              -> documentacion Swagger minima (HTML sin dependencias)
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

// --- Spec Swagger (OpenAPI 3.0) ---
function baseUrl(req) {
  if (process.env.RENDER_EXTERNAL_URL) return process.env.RENDER_EXTERNAL_URL;
  const host = req.headers.host || `localhost:${PORT}`;
  return `http://${host}`;
}

function teacherInputSchema() {
  return {
    type: 'object',
    required: ['name', 'profession'],
    properties: {
      name: { type: 'string', example: 'Ada Lovelace' },
      profession: { type: 'string', example: 'Docente de Programacion' },
      headline: { type: 'string', example: 'Pionera de la computacion' },
      description: { type: 'string', example: 'Docente e investigadora...' },
      photo: { type: 'string', example: 'https://...' },
      profileUrl: { type: 'string', example: 'https://www.linkedin.com/in/...' },
      area: { type: 'string', example: 'Ingenieria de Software' },
      aliases: { type: 'array', items: { type: 'string' }, example: ['ada', 'lovelace'] },
    },
  };
}

function openApiSpec(req) {
  const base = baseUrl(req);
  return {
    openapi: '3.0.0',
    info: {
      title: 'Teachers Cloud — microservicio Docentes UNINPAHU (DynamoDB + CRUD)',
      version: '2.0.0',
      description:
        'Docentes servidos SOLO desde DynamoDB (tabla teachers). Sin fallback en memoria: sin BD responde 503. Escrituras abiertas sin auth (uso universitario). Semilla de respaldo en teachers.seed.json + `npm run seed`.',
    },
    servers: [{ url: base, description: process.env.RENDER_EXTERNAL_URL ? 'Render' : 'Local' }],
    paths: {
      '/health': {
        get: { summary: 'Salud del microservicio (+ DB)', responses: { 200: { description: 'OK' }, 503: { description: 'Sin acceso a DynamoDB' } } },
      },
      '/teachers': {
        get: {
          summary: 'Lista docentes (resumen)',
          parameters: [
            {
              in: 'query',
              name: 'query',
              required: false,
              schema: { type: 'string' },
              example: 'leonardo',
              description: 'Filtra por nombre o profesion (opcional).',
            },
          ],
          responses: {
            200: { description: 'Arreglo {id, name, profession, headline, photo, profileUrl}' },
            503: { description: NO_DB_MESSAGE },
          },
        },
        post: {
          summary: 'Crea un docente (id = max+1)',
          requestBody: { required: true, content: { 'application/json': { schema: teacherInputSchema() } } },
          responses: {
            201: { description: 'Detalle creado {id, name, profession, headline, description, photo, profileUrl, area, order}' },
            400: { description: 'Falta name o profession / JSON invalido' },
            403: { description: 'Rol IAM sin permiso de escritura (PutItem).' },
            503: { description: NO_DB_MESSAGE },
          },
        },
      },
      '/teachers/{query}': {
        get: {
          summary: 'Docente por ID o nombre',
          parameters: [
            {
              in: 'path',
              name: 'query',
              required: true,
              schema: { type: 'string' },
              example: '2',
              description: 'ID numerico o nombre/alias.',
            },
          ],
          responses: {
            200: { description: 'Detalle {id, name, profession, headline, description, photo, profileUrl, area, order}' },
            400: { description: 'Falta query' },
            404: { description: 'No existe' },
            503: { description: NO_DB_MESSAGE },
          },
        },
      },
      '/teachers/{id}': {
        put: {
          summary: 'Reemplazo total por ID numerico',
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' }, example: 4 }],
          requestBody: { required: true, content: { 'application/json': { schema: teacherInputSchema() } } },
          responses: {
            200: { description: 'Detalle reemplazado' },
            400: { description: 'ID no numerico / falta name o profession' },
            404: { description: 'No existe ese ID' },
            403: { description: 'Rol IAM sin permiso de escritura (PutItem).' },
            503: { description: NO_DB_MESSAGE },
          },
        },
        patch: {
          summary: 'Actualizacion parcial por ID numerico',
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' }, example: 4 }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: teacherInputSchema().properties,
                  description: 'Al menos un campo editable.',
                },
              },
            },
          },
          responses: {
            200: { description: 'Detalle actualizado' },
            400: { description: 'ID no numerico / PATCH sin campos' },
            404: { description: 'No existe ese ID' },
            403: { description: 'Rol IAM sin permiso de escritura (PutItem).' },
            503: { description: NO_DB_MESSAGE },
          },
        },
        delete: {
          summary: 'Borra por ID numerico',
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'integer' }, example: 4 }],
          responses: {
            200: { description: 'Detalle borrado' },
            400: { description: 'ID no numerico' },
            404: { description: 'No existe ese ID' },
            403: { description: 'Rol IAM sin permiso de borrado (DeleteItem).' },
            503: { description: NO_DB_MESSAGE },
          },
        },
      },
    },
  };
}

function docsHtml() {
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Teachers Cloud — Docs</title>
<style>body{font-family:system-ui,Arial,sans-serif;max-width:760px;margin:32px auto;padding:0 16px;color:#222}
code{background:#f4f4f4;padding:2px 6px;border-radius:6px}a{color:#D64545}
.card{border:1px solid #eee;border-radius:12px;padding:16px;margin:12px 0}
.warn{background:#FFF7ED;border:1px solid #FDBA74;border-radius:12px;padding:12px 16px;margin:12px 0}</style></head><body>
<h1>Teachers Cloud — Docentes UNINPAHU (CRUD)</h1>
<p>Microservicio Node nativo (sin Express) + DynamoDB. Spec: <a href="/openapi.json">/openapi.json</a></p>
<div class="warn"><b>Sin fallback:</b> sin llaves AWS/tabla responde <code>503 ${NO_DB_MESSAGE}</code>. La semilla <code>teachers.seed.json</code> es solo respaldo para <code>npm run seed</code>.</div>
<div class="card"><b>GET /health</b><br/><code>curl /health</code></div>
<div class="card"><b>GET /teachers</b> — lista resumen<br/><code>curl /teachers</code><br/><code>curl /teachers?query=leonardo</code> (query param, sin body)</div>
<div class="card"><b>GET /teachers/:query</b> — detalle por path param<br/><code>curl /teachers/2</code><br/><code>curl /teachers/elfar</code></div>
<div class="card"><b>POST /teachers</b> — crear (body JSON, exige name+profession)<br/><code>curl -X POST /teachers -H "Content-Type: application/json" -d '{"name":"Ada Lovelace","profession":"Docente"}'</code></div>
<div class="card"><b>PUT /teachers/:id</b> — reemplazo total (id numerico)<br/><code>curl -X PUT /teachers/4 -H "Content-Type: application/json" -d '{"name":"Ada Lovelace","profession":"Docente de Programacion"}'</code></div>
<div class="card"><b>PATCH /teachers/:id</b> — parcial<br/><code>curl -X PATCH /teachers/4 -H "Content-Type: application/json" -d '{"area":"Ingenieria"}'</code></div>
<div class="card"><b>DELETE /teachers/:id</b> — borra<br/><code>curl -X DELETE /teachers/4</code></div>
<p>Escrituras abiertas sin auth (uso universitario).</p>
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
    if (path === '/openapi.json') {
      sendJson(res, 200, openApiSpec(req));
      return;
    }
    if (path === '/docs') {
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
