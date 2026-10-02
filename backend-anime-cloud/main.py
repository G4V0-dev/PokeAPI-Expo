"""
Microservicio cloud Anime (FastAPI + Swagger auto).
Lee 10 personajes curados desde DynamoDB (tabla anime_characters).
Secretos SOLO por variables de entorno (.env local ignorado / env vars Render).
Docs interactivas: GET /docs
"""
import os
from decimal import Decimal

import boto3
from botocore.exceptions import ClientError
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse

load_dotenv()

AWS_REGION = os.environ.get("AWS_REGION", "us-east-2")
TABLE_NAME = os.environ.get("TABLE_NAME", "anime_characters")
PORT = int(os.environ.get("PORT", "3102"))

for var in ("AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY"):
    if not os.environ.get(var):
        raise SystemExit(f"Falta {var} en .env (llaves IAM, nunca en git).")

ddb = boto3.resource("dynamodb", region_name=AWS_REGION)
table = ddb.Table(TABLE_NAME)

app = FastAPI(
    title="Anime Cloud — microservicio personajes (DynamoDB)",
    version="1.0.0",
    description="10 personajes de Naruto curados servidos desde DynamoDB. Seed original: dattebayo-api.",
)


def _norm(v):
    if isinstance(v, Decimal):
        return int(v) if v == int(v) else float(v)
    if isinstance(v, dict):
        return {k: _norm(x) for k, x in v.items()}
    if isinstance(v, list):
        return [_norm(x) for x in v]
    return v


def to_curated(item: dict) -> dict:
    data = _norm(item.get("data", {}))
    order = int(item.get("order", 0))
    # vecinos por orden de seed (los IDs Dattebayo no son secuenciales)
    data["prevId"] = None
    data["nextId"] = None
    data["_order"] = order
    return data


@app.get("/", summary="Info del servicio")
def root():
    return {"service": "anime-cloud", "table": TABLE_NAME, "region": AWS_REGION, "docs": "/docs"}


@app.get("/health", summary="Salud del microservicio (+ DynamoDB)")
def health():
    try:
        table.scan(Limit=1, Select="COUNT")
        return {"ok": True, "db": True}
    except ClientError:
        return JSONResponse({"ok": False, "db": False}, status_code=500)


@app.get("/characters", summary="Lista los 10 personajes (resumen)")
def list_characters():
    try:
        items = table.scan().get("Items", [])
    except ClientError as e:
        raise HTTPException(500, f"DynamoDB: {e.response['Error']['Code']}")
    out = []
    for it in sorted(items, key=lambda x: int(x.get("order", 0))):
        d = _norm(it.get("data", {}))
        out.append({"id": int(it["id"]), "name": d.get("name"),
                    "image": (d.get("images") or [None])[0],
                    "clan": d.get("clan"), "signatureJutsu": d.get("signatureJutsu")})
    return out


@app.get("/characters/{query}", summary="Personaje curado por nombre o ID")
def get_character(query: str):
    q = query.strip()
    if not q:
        raise HTTPException(400, "Falta query: usa /characters/sasuke o /characters/1307")
    try:
        if q.isdigit():
            r = table.get_item(Key={"id": int(q)})
            item = r.get("Item")
        else:
            items = table.scan().get("Items", [])
            exact = [x for x in items
                     if x.get("name_lower") == q or q in (x.get("aliases") or [])]
            if exact:
                item = exact[0]
            else:
                starts = [x for x in items if x.get("name_lower", "").startswith(q)]
                item = (starts[0] if starts
                        else next((x for x in items if q in x.get("name_lower", "")), None))
    except ClientError as e:
        raise HTTPException(500, f"DynamoDB: {e.response['Error']['Code']}")
    if not item:
        raise HTTPException(404, "Personaje no encontrado en la nube (solo 10 disponibles).")
    data = to_curated(item)
    data.pop("_order", None)
    # vecinos por orden de seed (los IDs Dattebayo no son secuenciales)
    ordered = sorted(
        table.scan(ProjectionExpression="#o, id",
                   ExpressionAttributeNames={"#o": "order"}).get("Items", []),
        key=lambda x: int(x.get("order", 0)),
    )
    oids = [int(x["id"]) for x in ordered]
    if int(item["id"]) in oids:
        n = oids.index(int(item["id"]))
        data["prevId"] = oids[n - 1] if n > 0 else None
        data["nextId"] = oids[n + 1] if n < len(oids) - 1 else None
    return data
