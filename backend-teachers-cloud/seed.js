/**
 * Seed: crea tabla teachers (si falta) y carga los 3 docentes curados
 * en DynamoDB con `order` 1-3.
 * Uso: node seed.js  (lee .env: llaves IAM + region + tabla)
 * Requiere: AWS_ACCESS_KEY_ID + AWS_SECRET_ACCESS_KEY en .env (nunca en git).
 */
require('dotenv').config();
const { DynamoDBClient, CreateTableCommand, DescribeTableCommand } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');
const { TEACHERS } = require('./teachers.data');

const AWS_REGION = process.env.AWS_REGION || 'us-east-2';
const TABLE_NAME = process.env.TABLE_NAME || 'teachers';

if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
  console.error('Falta AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY en .env (llaves IAM, nunca en git).');
  process.exit(1);
}

const client = new DynamoDBClient({ region: AWS_REGION });
const doc = DynamoDBDocumentClient.from(client);

async function ensureTable() {
  try {
    await client.send(new DescribeTableCommand({ TableName: TABLE_NAME }));
    console.log(`tabla ${TABLE_NAME} ya existe.`);
  } catch (e) {
    if (e.name !== 'ResourceNotFoundException') throw e;
    console.log(`creando tabla ${TABLE_NAME} ...`);
    await client.send(
      new CreateTableCommand({
        TableName: TABLE_NAME,
        BillingMode: 'PAY_PER_REQUEST',
        AttributeDefinitions: [{ AttributeName: 'id', AttributeType: 'N' }],
        KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }],
      })
    );
    // espera simple hasta ACTIVE
    for (let i = 0; i < 30; i++) {
      await new Promise((r) => setTimeout(r, 2000));
      const d = await client.send(new DescribeTableCommand({ TableName: TABLE_NAME }));
      if (d.Table.TableStatus === 'ACTIVE') break;
    }
    console.log(`tabla ${TABLE_NAME} ACTIVE.`);
  }
}

(async () => {
  await ensureTable();
  for (const t of TEACHERS) {
    await doc.send(new PutCommand({ TableName: TABLE_NAME, Item: t }));
    console.log(`seed OK order=${t.order} id=${t.id} ${t.data.name}`);
  }
  console.log(`TOTAL en nube: ${TEACHERS.length}`);
})().catch((e) => {
  console.error('SEED FAIL:', e.message);
  process.exit(1);
});
