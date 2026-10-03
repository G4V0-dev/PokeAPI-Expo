/**
 * Microservicio cloud Docentes UNINPAHU (Node NATIVO + Swagger, SIN Express).
 * Solo usa node:http + node:url. La conexion a datos es AGNOSTICA (db.js):
 * DynamoDB si hay credenciales, memoria si no.
 *
 * Endpoints (solo path/query params, NUNCA body):
 *   GET /                  -> info del servicio
 *   GET /health            -> { ok, db, mode }
 *   GET /teachers          -> [{ id, name, profession, headline, photo, profileUrl }]
 *   GET /teachers?query=x  -> filtrado por nombre/profesion (query param)
 *   GET /teachers/:query   -> detalle por id numerico o nombre (path param)
 *   GET /openapi.json      -> spec Swagger JSON
 *   GET /docs              -> documentacion Swagger minima (HTML sin dependencias)
 */
require('dotenv').config();
const http = require('node:http');
const { URL } = require('node:url');
const { createMemoryRepository, createDynamoRepository } = require('./db');
const { TEACHERS } = require('./teachers.data');

const PORT = Number(process.env.PORT || 3103);
const TABLE_NAME = process.env.TABLE_NAME || 'teachers';
const AWS_REGION = process.env.AWS_REGION || 'us-east-2';
const HAS_AWS_KEYS = Boolean(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY);

// --- Repositorio agnostico (no tocar HTTP para cambiar de motor) ---
let repo = createMemoryRepository(TEACHERS);
async function initRepo() {
  if (!HAS_AWS_KEYS) {
    console.log('[teachers] sin llaves AWS -> modo memoria (3 docentes seed).');
    return;
  }
  try {
    const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
    const { DynamoDBDocumentClient, ScanCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');
    const client = new DynamoDBClient({ region: AWS_REGION });
    const docClient = DynamoDBDocumentClient.from(client);
    const dynamo = createDynamoRepository({ docClient, tableName: TABLE_NAME, ScanCommand, GetCommand });
    await dynamo.health(); // valida conexion + tabla
    repo = dynamo;
    console.log(`[teachers] conectado a DynamoDB ${AWS_REGION}/${TABLE_NAME}.`);
  } catch (e) {
    console.log(`[teachers] DynamoDB no disponible (${e.message}) -> modo memoria.`);
    repo = createMemoryRepository(TEACHERS);
  }
}

// --- Spec Swagger (OpenAPI 3.0) ---
function baseUrl(req) {
  if (process.env.RENDER_EXTERNAL_URL) return process.env.RENDER_EXTERNAL_URL;
  const host = req.headers.host || `localhost:${PORT}`;
  return `http://${host}`;
}

function openApiSpec(req) {
  const base = baseUrl(req);
  return {
    openapi: '3.0.0',
    info: {
      title: 'Teachers Cloud — microservicio Docentes UNINPAHU (DynamoDB)',
      version: '1.0.0',
      description:
        '3 docentes curados servidos desde DynamoDB (tabla teachers). Solo lectura con path/query params, sin body. Fotos: placeholder ui-avatars hasta pegar URL real (LinkedIn bloquea scraping con 999).',
    },
    servers: [{ url: base, description: process.env.RENDER_EXTERNAL_URL ? 'Render' : 'Local' }],
    paths: {
      '/health': {
        get: { summary: 'Salud del microservicio (+ DB)', responses: { 200: { description: 'OK' } } },
      },
      '/teachers': {
        get: {
          summary: 'Lista los 3 docentes (resumen)',
          parameters: [
            {
              in: 'query',
              name: 'query',
              required: false,
              schema: { type: 'string' },
              example: 'lotus',
              description: 'Filtra por nombre o profesion (opcional).',
            },
          ],
          responses: { 200: { description: 'Arreglo {id, name, profession, headline, photo, profileUrl}' } },
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
              description: 'ID numerico (1-3) o nombre/alias: elfar, lotus, javier.',
            },
          ],
          responses: {
            200: { description: 'Detalle {id, name, profession, headline, description, photo, profileUrl, area}' },
            400: { description: 'Falta query' },
            404: { description: 'No existe (solo 3 disponibles)' },
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
.card{border:1px solid #eee;border-radius:12px;padding:16px;margin:12px 0}</style></head><body>
<h1>Teachers Cloud — Docentes UNINPAHU</h1>
<p>Microservicio Node nativo (sin Express) + DynamoDB. Spec: <a href="/openapi.json">/openapi.json</a></p>
<div class="card"><b>GET /health</b><br/><code>curl /health</code></div>
<div class="card"><b>GET /teachers</b> — lista resumen<br/><code>curl /teachers</code><br/><code>curl /teachers?query=lotus</code> (query param, sin body)</div>
<div class="card"><b>GET /teachers/:query</b> — detalle por path param<br/><code>curl /teachers/2</code><br/><code>curl /teachers/javier</code></div>
<p>Fotos temporales ui-avatars (LinkedIn 999). Ver <code>teachers.data.js</code> para reemplazar.</p>
</body></html>`;
}

// --- Helpers HTTP ---
function sendJson(res, status, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
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

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === 'OPTIONS') {
      res.writeHead(204, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      });
      res.end();
      return;
    }
    if (req.method !== 'GET') {
      sendJson(res, 405, { error: 'Solo se permite GET (sin body params).' });
      return;
    }
    const u = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    const path = u.pathname.replace(/\/+$/, '') || '/';

    if (path === '/') {
      sendJson(res, 200, {
        service: 'teachers-cloud',
        table: HAS_AWS_KEYS ? TABLE_NAME : 'memory',
        region: AWS_REGION,
        mode: repo.mode,
        docs: '/docs',
        spec: '/openapi.json',
      });
      return;
    }
    if (path === '/health') {
      try {
        const h = await repo.health();
        sendJson(res, 200, h);
      } catch {
        sendJson(res, 500, { ok: false, db: false, mode: repo.mode });
      }
      return;
    }
    if (path === '/teachers') {
      const list = await repo.listTeachers(u.searchParams.get('query') || '');
      sendJson(res, 200, list);
      return;
    }
    if (path.startsWith('/teachers/')) {
      const query = decodeURIComponent(path.slice('/teachers/'.length)).trim();
      if (!query) {
        sendJson(res, 400, { error: 'Falta query: usa /teachers/2 o /teachers/lotus' });
        return;
      }
      const item = await repo.getTeacher(query);
      if (!item) {
        sendJson(res, 404, { error: 'Docente no encontrado en la nube (solo 3 disponibles).' });
        return;
      }
      sendJson(res, 200, item);
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
    console.log(`Teachers cloud en http://localhost:${PORT} -> docs en /docs (modo ${repo.mode})`);
  });
});
