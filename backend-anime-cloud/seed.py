"""
Seed: resuelve 10 personajes clásicos desde dattebayo-api y los guarda
curados en DynamoDB (tabla anime_characters) con `order` para prev/next.
Uso: python seed.py  (lee .env: llaves IAM + región + tabla)
"""
import json
import os
import urllib.parse
import urllib.request
from decimal import Decimal

import boto3
from dotenv import load_dotenv

load_dotenv()

NAMES = ["naruto", "sasuke", "sakura", "kakashi", "itachi",
         "madara", "nagato", "jiraiya", "hinata", "gaara"]
# La API Dattebayo no tiene entrada "pain": el personaje es "Nagato" (Pain es su alias).
ALIASES = {"nagato": ["pain"]}
BASE = "https://dattebayo-api.onrender.com/characters"

table = boto3.resource("dynamodb", region_name=os.environ.get("AWS_REGION", "us-east-2")) \
    .Table(os.environ.get("TABLE_NAME", "anime_characters"))


def get(url):
    with urllib.request.urlopen(url, timeout=30) as r:
        return json.load(r)


def first(v):
    return (v[0] if isinstance(v, list) else v) or None


def to_curated(c):
    personal, debut = c.get("personal") or {}, c.get("debut") or {}
    aff = personal.get("affiliation")
    villages = aff if isinstance(aff, list) else ([aff] if aff else [])
    jutsus = c.get("jutsu") if isinstance(c.get("jutsu"), list) else []
    images = c.get("images") if isinstance(c.get("images"), list) else []
    return {
        "id": c["id"], "name": c["name"], "images": images,
        "clan": personal.get("clan"), "villages": villages,
        "signatureJutsu": first(jutsus),
        "sex": personal.get("sex"), "age": personal.get("age"),
        "height": first(personal.get("height")), "weight": first(personal.get("weight")),
        "debutManga": debut.get("manga"), "debutAnime": debut.get("anime"),
        "natureTypes": c.get("natureType") if isinstance(c.get("natureType"), list) else [],
        "jutsus": jutsus,
        "family": c.get("family") if isinstance(c.get("family"), dict) else {},
        "rank": c.get("rank") if isinstance(c.get("rank"), dict) else {},
        "tools": (c.get("tools") if isinstance(c.get("tools"), list) else [])[:20],
    }


def resolve(name):
    body = get(f"{BASE}?name={urllib.parse.quote(name)}")
    cands = body.get("characters") or []
    if not cands:
        raise RuntimeError(f"sin resultados para {name}")
    exact = [c for c in cands if str(c.get("name", "")).lower() == name]
    return exact[0] if exact else cands[0]


def to_dynamo(obj):
    return json.loads(json.dumps(obj), parse_float=Decimal)


for n, name in enumerate(NAMES, start=1):
    raw = resolve(name)
    data = to_curated(raw)
    table.put_item(Item={"id": int(data["id"]), "name_lower": data["name"].lower(),
                         "aliases": ALIASES.get(name, []),
                         "order": n, "seed_key": name, "data": to_dynamo(data)})
    print(f"seed OK order={n} id={data['id']} {data['name']} (pedido: {name})")

print("TOTAL en nube:", len(NAMES))
