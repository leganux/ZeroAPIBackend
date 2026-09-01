<div align="center">

# ⚡ ZeroAPIBackend

### *The instant backend for humans and AI agents.*

[![npm version](https://img.shields.io/npm/v/zeroapibackend?color=blueviolet&style=for-the-badge&logo=npm)](https://www.npmjs.com/package/zeroapibackend)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](./LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-20%2B-green?style=for-the-badge&logo=node.js)](https://nodejs.org)
[![Made by Leganux](https://img.shields.io/badge/Made%20by-Leganux-ff69b4?style=for-the-badge)](https://leganux.com)

> **A full REST API + database, running in under 60 seconds.**
> **Zero configuration. Zero boilerplate. Zero excuses.**

[🚀 Quick Start](#️-1-minute-quick-start) · [📖 Docs](#️-how-to-use) · [🌐 Español](./README.es.md) · [🤝 Contributing](#-contributing)

</div>

---

## 🧠 Why "for humans AND AI agents"?

Most backend tools were designed for one type of user: the developer who reads docs, writes code, and configures things manually. But the world has changed.

Today there are **two kinds of builders**:

| 👤 Humans | 🤖 AI Agents |
|-----------|-------------|
| Frontend devs who need a quick backend | LLMs & autonomous agents that call REST APIs to store and retrieve data |
| Data analysts who want to query a dataset | AI pipelines that need a persistent, schema-free datastore |
| Hackathon teams who need a backend *right now* | Code-generation tools that scaffold projects and need a live API endpoint |
| Educators teaching REST concepts | Autonomous workflows (LangChain, CrewAI, AutoGPT…) that need memory/state |

**ZeroAPIBackend speaks fluently to both.** A human runs one command. An AI agent fires HTTP requests. The backend just works — no schemas to define, no migrations to run, no config files to write.

> 💡 The name is a statement: this backend does not care *who* is calling it. Whether it's a curious developer or a GPT-4 function-call loop, ZeroAPI responds instantly.

---

## ⏱️ 1-Minute Quick Start

> From zero to a live REST API with a real database in **under 60 seconds**. Seriously.

```bash
# Step 1 — Install (only once)
npm install -g zeroapibackend

# Step 2 — Launch 🚀
zeroAPI run
```

✅ Your API is live at **http://localhost:3000**

```bash
# Try it immediately — no tables to create, no schema to define:
curl -X POST http://localhost:3000/api/users/ \
  -H "Content-Type: application/json" \
  -d '{"name": "Alice", "email": "alice@example.com", "age": 30}'

# Read it back:
curl http://localhost:3000/api/users/
```

> 🎉 **A full CRUD REST API with persistent storage is now running.**
> No database server. No ORM setup. No config files. Just one command.

---

## 🗂️ Table of Contents

- [Why humans and AI agents?](#-why-humans-and-ai-agents)
- [1-Minute Quick Start](#️-1-minute-quick-start)
- [Features](#-features)
- [Use Cases](#-use-cases)
- [Database Flavors](#️-database-flavors)
- [Rate Limiting](#️-rate-limiting)
- [Integration with Gateways & Proxies](#-integration-with-api-gateways--reverse-proxies)
- [Schema Validation](#-schema-validation)
- [How to Use](#️-how-to-use)
- [Endpoints](#-endpoints)
- [Query Parameters](#-query-parameters)
- [How Populates Work](#-how-populates-work)
- [Full Examples](#-full-examples)
- [Statistics Endpoint](#-statistics-endpoint)
- [Contributing](#-contributing)

---

## ✨ Features

- ⚡ **Instant REST API** — launch a fully functional API with a single command
- 🗄️ **No database setup** — the database is embedded; tables are created on-the-fly
- 🔄 **Dynamic table handling** — CRUD on any table, any time, no predefined schemas
- 🤖 **AI-agent ready** — schema-free endpoints any LLM or autonomous agent can consume via HTTP
- 📊 **Statistics endpoints** — mean, median, mode, std, variance, quartiles built-in
- 🔐 **Advanced security** — ACL config + JWT Bearer token authentication
- 🌍 **Public sharing** — expose your local API to the internet via ngrok integration
- 🧩 **Multi-database support** — TingoDB (embedded), SQLite, and MongoDB
- 🛡️ **Rate limiting** — built-in per-IP throttling (default 3 req/s, configurable)
- 🧹 **Data cleaning** — import JSON/CSV datasets and clean them via REST
- 📐 **Schema validation** — optional JSON-based request validation layer

---

## 🎯 Use Cases

| Who | How |
|-----|-----|
| 👨‍💻 **Frontend developers** | Spin up a real REST API in seconds without writing any backend code. Ideal for prototyping and demos. |
| 📊 **Data analysts** | Import a JSON/CSV dataset, query it via REST, and get statistics (mean, median, std, quartiles) out of the box. |
| 🏆 **Hackathon teams** | Full persistent backend in one command — no cloud setup, no config files. |
| 🧪 **QA / Testing** | Reproducible API fixtures using TingoDB or SQLite; reset data with a single `DELETE /api/:table/drop`. |
| 🛠️ **Internal tools** | Lightweight backend for dashboards, admin panels, and scripts that need a quick datastore. |
| 🔁 **CI/CD pipelines** | SQLite flavor gives you a zero-dependency file-based backend that works anywhere Node.js runs. |
| 🎓 **Education** | Teach REST API concepts without boilerplate — students can hit real endpoints immediately. |
| 🤖 **AI Agents** | LLMs, LangChain agents, AutoGPT, CrewAI — any agent that can make HTTP calls gets instant persistent memory. |

---

## 🗄️ Database Flavors

ZeroAPIBackend supports three database backends. All expose the **same REST API** — no code changes needed when switching.

| Flavor | When to use | How to identify |
|--------|-------------|-----------------|
| 🟢 **TingoDB** (default) | Local development, zero config | Any plain name, e.g. `api`, `myproject` |
| 🔵 **SQLite** | File-based persistence, CI/CD, edge | Path ending in `.sqlite` or `.db`, or prefixed with `sqlite:` |
| 🟠 **MongoDB** | Production, cloud, replica sets | Connection string starting with `mongodb://` or `mongodb+srv://` |

### Selecting the flavor at startup

**Priority order:** CLI argument `--database` → environment variable `DATABASE` → default (`api` = TingoDB)

```bash
# TingoDB — default embedded DB
zeroAPI run

# TingoDB — custom folder name
zeroAPI run --database my_project

# SQLite
zeroAPI run --database /data/app.sqlite
zeroAPI run --database sqlite:/data/app.sqlite

# MongoDB
zeroAPI run --database mongodb://localhost:27017/mydb
zeroAPI run --database mongodb+srv://user:pass@cluster.mongodb.net/mydb

# Custom port
zeroAPI run --database /data/app.sqlite --port 4000
PORT=4000 DATABASE=/data/app.sqlite zeroAPI run

# Rate limiting
zeroAPI run --rate-limit 10
RATE_LIMIT=10 zeroAPI run
```

The startup banner shows the active flavor:

```
┌─────────────────────────────────────────────┐
│            ZeroAPI Backend                  │
├─────────────────────────────────────────────┤
│  Server  : http://localhost:3000             │
│  DB Type : SQLite (Sequelize)               │
│  DB      : /data/app.sqlite                 │
│  Rate    : 3 req/s per IP                   │
└─────────────────────────────────────────────┘
```

### Adapter files

| File | Description |
|------|-------------|
| `adapters/tingodb.adapter.js` | TingoDB — embedded NoSQL (original behaviour) |
| `adapters/sqlite.adapter.js` | SQLite via Sequelize — document-store strategy (`_id` + `_doc` JSON) |
| `adapters/mongoose.adapter.js` | MongoDB via Mongoose — flexible schema, UUID `_id` |
| `database.js` | Auto-detects the flavor and delegates to the right adapter |

---

## 🛡️ Rate Limiting

A built-in rate limiter protects every endpoint. The default is **3 requests per second per IP**.

**Priority order:** CLI argument `--rate-limit` → environment variable `RATE_LIMIT` → default (`3`)

```bash
zeroAPI run                    # Default (3 req/s)
zeroAPI run --rate-limit 60    # Custom limit
RATE_LIMIT=60 zeroAPI run      # Via env var
```

Requests that exceed the limit receive a `429 Too Many Requests` response:

```json
{ "status": 429, "message": "Too many requests, slow down." }
```

---

## 🌐 Integration with API Gateways & Reverse Proxies

ZeroAPIBackend is designed to run as a **standalone microservice**. In production, place it behind a gateway or reverse proxy for TLS and authentication.

### nginx

```nginx
# /etc/nginx/sites-available/zeroapi
server {
    listen 443 ssl;
    server_name api.example.com;

    ssl_certificate     /etc/letsencrypt/live/api.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.example.com/privkey.pem;

    location /api/ {
        proxy_pass         http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header   Host              $host;
        proxy_set_header   X-Real-IP         $remote_addr;
        proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
    }
}
```

Start ZeroAPIBackend on the private port and nginx will handle the public face:

```bash
RATE_LIMIT=30 node app.js --database mongodb://localhost:27017/prod --port 3000
```

> **Tip:** Set `RATE_LIMIT` higher when nginx already enforces its own `limit_req` rules.

---

### Express Gateway

[Express Gateway](https://www.express-gateway.io/) is a microservices API gateway built on top of Express. Use it to add JWT validation, OAuth2, key-auth, and per-consumer rate limits in front of one or more ZeroAPIBackend instances.

**1. Install Express Gateway**

```bash
npm install -g express-gateway
eg gateway create my-gateway
cd my-gateway
```

**2. Configure `gateway.config.yml`**

```yaml
http:
  port: 8080

apiEndpoints:
  zeroapi:
    host: '*'
    paths:
      - '/api/*'

serviceEndpoints:
  zeroapiBackend:
    url: 'http://localhost:3000'

policies:
  - proxy
  - rate-limit
  - jwt

pipelines:
  main:
    apiEndpoints:
      - zeroapi
    policies:
      # Optional JWT check — remove if the endpoint is public
      - jwt:
          - action:
              secretOrPublicKey: 'your-secret'
              checkCredentialExistence: false
      # Gateway-level rate limit (complements ZeroAPIBackend's built-in one)
      - rate-limit:
          - action:
              max: 100
              windowMs: 60000   # 100 req/min per consumer
      - proxy:
          - action:
              serviceEndpoint: zeroapiBackend
              changeOrigin: true
```

**3. Start both services**

```bash
# Terminal 1 — ZeroAPIBackend (internal, no public exposure)
RATE_LIMIT=100 node app.js --database /data/prod.sqlite --port 3000

# Terminal 2 — Express Gateway (public-facing, port 8080)
cd my-gateway && eg gateway start
```

All public traffic hits `:8080`; ZeroAPIBackend stays on `localhost:3000`.

---

### Docker Compose (ZeroAPIBackend + nginx)

A minimal `docker-compose.yml` to containerise both services:

```yaml
version: '3.9'

services:
  zeroapi:
    image: node:20-alpine
    working_dir: /app
    volumes:
      - .:/app
      - zeroapi-data:/app/local
    command: node app.js --database /app/local/prod --port 3000
    environment:
      RATE_LIMIT: "30"
    expose:
      - "3000"

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/conf.d/default.conf:ro
    depends_on:
      - zeroapi

volumes:
  zeroapi-data:
```

`nginx.conf`:

```nginx
server {
    listen 80;
    location /api/ {
        proxy_pass http://zeroapi:3000;
    }
}
```

```bash
docker compose up -d
```

---

### Architecture overview

```
Internet
    │
    ▼
┌──────────────────────────────┐
│  nginx / Express Gateway     │  TLS · Auth · Public rate-limit
└──────────────┬───────────────┘
               │  HTTP (internal)
               ▼
┌──────────────────────────────┐
│     ZeroAPIBackend :3000     │  Built-in rate-limit · Schema validation
│                              │  TingoDB │ SQLite │ MongoDB
└──────────────────────────────┘
```

---

## 📐 Schema Validation

ZeroAPIBackend includes an optional **schema validation middleware** that controls which resources, operations and fields are accessible via the REST API.  
It is activated by passing a JSON schema file at startup — without it the API remains fully open (original behaviour).

### How it works

When active, the middleware intercepts every request to `/api/*` and enforces three sequential checks:

| # | Check | HTTP response on failure |
|---|-------|--------------------------|
| 1 | The resource (`/api/:table`) exists in the schema | `403 Forbidden` |
| 2 | The operation (e.g. `deleteOne`) is allowed for that resource | `403 Forbidden` |
| 3 | The request body passes the field rules (write operations only) | `400 Bad Request` |

If all checks pass, the request continues to the normal route handler.

### Activating the middleware

**Priority order:** CLI argument `--schema` → environment variable `SCHEMA` → disabled

```bash
# CLI argument
zeroAPI run --schema ./example.schema.json

# Environment variable
SCHEMA=./example.schema.json zeroAPI run

# Combined with other options
zeroAPI run --database /data/app.sqlite --port 4000 --schema ./schemas/api.schema.json
```

When the schema is loaded, the startup banner shows the active file:

```
┌─────────────────────────────────────────────┐
│            ZeroAPI Backend                  │
├─────────────────────────────────────────────┤
│  Server  : http://localhost:3000             │
│  DB Type : TingoDB (local)                  │
│  DB      : api                              │
│  Rate    : 3 req/s per IP                   │
│  Schema  : ./example.schema.json            │
└─────────────────────────────────────────────┘
```

### Schema file format

```json
{
  "version": "1.0",
  "title": "My API Schema",
  "paths": [
    {
      "path": "/api/users",
      "ops": ["createOne", "getAll", "getOne", "updateOne", "deleteOne"],
      "fields": {
        "name":  { "type": "string",  "required": true },
        "email": { "type": "string",  "required": true, "format": "email" },
        "age":   { "type": "number",  "minimum": 0, "maximum": 120 }
      }
    },
    {
      "path": "/api/products",
      "ops": "*",
      "fields": {
        "name":  { "type": "string", "required": true },
        "price": { "type": "number", "required": true, "minimum": 0 }
      }
    },
    {
      "path": "/api/topics",
      "ops": ["-deleteOne"],
      "fields": "**"
    }
  ]
}
```

> **Tip:** The schema file supports single-line `//` comments for readability.

### `ops` — allowed operations

| Value | Meaning |
|-------|---------|
| `"*"` | All operations are allowed |
| `["createOne", "getAll"]` | Only the listed operations are allowed |
| `["-deleteOne", "-drop"]` | All operations **except** the prefixed ones |

#### Full list of recognized operations

| Operation | Method | Route |
|-----------|--------|-------|
| `createOne` | `POST` | `/api/:table/` |
| `createMany` | `POST` | `/api/:table/many` |
| `getAll` | `GET` | `/api/:table/` |
| `getOne` | `GET` | `/api/:table/:id` |
| `getOneWhere` | `GET` | `/api/:table/one` |
| `updateOne` | `PUT` | `/api/:table/:id` |
| `updateMany` | `PUT` | `/api/:table/` |
| `updateOrCreate` | `PUT` | `/api/:table/findOrCreate` |
| `deleteOne` | `DELETE` | `/api/:table/:id` |
| `drop` | `DELETE` | `/api/:table/drop` |
| `statistics` | `GET` | `/api/:table/statistics` |
| `split` | `POST` | `/api/:table/split` |
| `json` | `POST` | `/api/:table/json` |
| `transform` | `POST` | `/api/:table/transform/:to` |

### `fields` — field validation rules

Set `"fields": "**"` to skip validation entirely, or define an object where each key is a field name and its value is a rule object:

| Rule | Types | Description |
|------|-------|-------------|
| `type` | all | `string`, `number`, `boolean`, `array`, `object` |
| `required` | all | `true` / `false` — field must be present and non-empty |
| `format` | string | `email`, `url`, `date` (ISO 8601), `uuid` |
| `minLength` | string | Minimum character length |
| `maxLength` | string | Maximum character length |
| `pattern` | string | Regular expression the value must match |
| `enum` | string, number | Array of allowed values |
| `minimum` | number | Minimum numeric value (inclusive) |
| `maximum` | number | Maximum numeric value (inclusive) |

### Error responses

**Resource not in schema (403)**
```json
{
  "status": 403,
  "message": "Acceso denegado: el recurso no está definido en el schema",
  "resource": "/api/unknown"
}
```

**Operation not allowed (403)**
```json
{
  "status": 403,
  "message": "Acceso denegado: la operación 'deleteOne' no está permitida en este recurso",
  "resource": "/api/topics",
  "operation": "deleteOne"
}
```

**Validation error (400)**
```json
{
  "status": 400,
  "message": "Error de validación",
  "resource": "/api/users",
  "operation": "createOne",
  "errors": [
    "El campo 'email' es requerido",
    "El campo 'age' debe ser >= 0"
  ]
}
```

### Example schema file

See [`example.schema.json`](./example.schema.json) for a ready-to-use reference with `users`, `products`, and `topics` resources demonstrating the three `ops` modes.

---

## 🛠️ How to Use

### Prerequisites

- Node.js 20+

### Install

```bash
npm install -g zeroapibackend
```

### Run

```bash
# Default port 3000
zeroAPI run

# Custom port
zeroAPI run -p 5050

# Custom port + custom database
zeroAPI run -p 5050 -d myproject

# Expose to the internet via ngrok
zeroAPI run -p 5050 -d myproject -ngr true
zeroAPI run -p 5050 -d myproject -ngr <your-ngrok-token>
```

### CLI Commands

#### `zeroAPI dump` — backup a database

```bash
zeroAPI dump --name myDatabase --dir /path/to/save/dump
```

| Option | Description |
|--------|-------------|
| `-n, --name` | Database name |
| `-d, --dir` | Directory where the dump will be saved |

#### `zeroAPI restore` — restore a database

> ⚠️ This will replace all existing records in the target database.

```bash
zeroAPI restore --name myDatabase --dir /path/to/file.zip
```

#### `zeroAPI drop` — delete a database

```bash
zeroAPI drop --name myDatabase
```

---

## 🔌 Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| `POST` | `/api/:table/many` | Create multiple records |
| `POST` | `/api/:table/` | Create a single record |
| `GET` | `/api/:table/` | Get multiple records |
| `GET` | `/api/:table/one` | Get a single record by condition |
| `GET` | `/api/:table/:id` | Get a single record by ID |
| `PUT` | `/api/:table/findOrCreate` | Update or create a record |
| `PUT` | `/api/:table/:id` | Update a record by ID |
| `PUT` | `/api/:table/` | Update records by condition |
| `DELETE` | `/api/:table/:id` | Delete a record by ID |
| `DELETE` | `/api/:table/drop` | Drop / clear entire table |
| `GET` | `/api/:table/statistics` | Field statistics |
| `GET` | `/database/describe` | Describe all collections/tables |

---

## 🔍 Query Parameters

### 1. `select` — Field Selection

```bash
curl "http://localhost:3000/api/users/?select=name,email"
```

### 2. `where` — Filtering

```bash
curl "http://localhost:3000/api/users/?where[age]=30"
```

### 3. `paginate` — Pagination

```bash
curl "http://localhost:3000/api/users/?paginate[limit]=10&paginate[page]=1"
```

### 4. `sort` — Sorting

```bash
curl "http://localhost:3000/api/users/?sort[createdAt]=-1"
```

### 5. `populate` — Join related documents

```bash
curl "http://localhost:3000/api/orders/?populate[localFields]=userId&populate[tables]=users&populate[foreignFields]=_id"
```

### Combined example

```bash
curl "http://localhost:3000/api/users/?select=name,email&paginate[limit]=5&paginate[page]=0&sort[createdAt]=1&where[age]=25"
```

### Using `select` on create

```bash
curl -X POST "http://localhost:3000/api/users/?select=name,email" \
  -H "Content-Type: application/json" \
  -d '{"name": "Jane Doe", "email": "jane.doe@example.com", "age": 28}'
```

---

## 🔗 How Populates Work

The `populateConstructor` function fetches related data from other tables and incorporates it into the main query result — mimicking SQL JOINs in a schema-free environment.

### How it works

1. **Parameter Parsing** — `populate` object contains `localFields`, `tables`, and `foreignFields` (comma-separated).
2. **Iteration** — for each result record, iterates over specified fields and tables.
3. **Filter Construction** — builds `$eq` or `$in` filters depending on whether the field value is a string or array.
4. **Field Selection** — `populateFields` limits which fields are returned from the foreign table.
5. **Database Query** — executes the lookup and replaces the local field value with the related document(s).

### Example: orders → users

```bash
# Basic populate
curl "http://localhost:3000/api/orders/?populate[localFields]=userId&populate[tables]=users&populate[foreignFields]=_id"

# With field selection (only name and email from users)
curl "http://localhost:3000/api/orders/?populate[localFields]=userId&populate[tables]=users&populate[foreignFields]=_id&populateFields[users]=name,email"
```

---

## 💻 Full Examples

### Python

```python
import requests
import json

BASE_URL = "http://localhost:3000/api"

# Helper function to print response
def print_response(response):
    print("Status Code:", response.status_code)
    try:
        print("Response JSON:", response.json())
    except json.JSONDecodeError:
        print("Response Text:", response.text)

# 1. Create Multiple Records
def create_many_users():
    url = f"{BASE_URL}/users/many"
    payload = [
        {"name": "Alice", "email": "alice@example.com", "age": 30},
        {"name": "Bob", "email": "bob@example.com", "age": 25}
    ]
    headers = {"Content-Type": "application/json"}
    response = requests.post(url, headers=headers, data=json.dumps(payload))
    print_response(response)

# 2. Create a Single Record
def create_user():
    url = f"{BASE_URL}/users/"
    payload = {"name": "Charlie", "email": "charlie@example.com", "age": 28}
    headers = {"Content-Type": "application/json"}
    response = requests.post(url, headers=headers, data=json.dumps(payload))
    print_response(response)

# 3. Get Multiple Records
def get_users():
    url = f"{BASE_URL}/users/"
    response = requests.get(url)
    print_response(response)

# 4. Get a Single Record by ID
def get_user_by_id(user_id):
    url = f"{BASE_URL}/users/{user_id}"
    response = requests.get(url)
    print_response(response)

# 5. Get a Single Record Based on Conditions
def get_user_by_condition():
    url = f"{BASE_URL}/users/one?where[age]=28"
    response = requests.get(url)
    print_response(response)

# 6. Update or Create a Record
def update_or_create_user():
    url = f"{BASE_URL}/users/findOrCreate"
    payload = {"name": "David", "email": "david@example.com", "age": 32}
    headers = {"Content-Type": "application/json"}
    response = requests.put(url, headers=headers, data=json.dumps(payload))
    print_response(response)

# 7. Update a Record by ID
def update_user_by_id(user_id):
    url = f"{BASE_URL}/users/{user_id}"
    payload = {"age": 29}
    headers = {"Content-Type": "application/json"}
    response = requests.put(url, headers=headers, data=json.dumps(payload))
    print_response(response)

# 8. Delete a Record by ID
def delete_user_by_id(user_id):
    url = f"{BASE_URL}/users/{user_id}"
    response = requests.delete(url)
    print_response(response)

# Example usage
if __name__ == "__main__":
    create_many_users()
    create_user()
    get_users()
    # Replace 'user_id' with an actual ID from your database
    user_id = "60d0fe4f5311236168a109ca"  # Example ID
    get_user_by_id(user_id)
    get_user_by_condition()
    update_or_create_user()
    update_user_by_id(user_id)
    delete_user_by_id(user_id)

```

### JavaScript (axios)

```javascript
 const axios = require('axios');

const BASE_URL = "http://localhost:3000/api";

// Helper function to print response
function printResponse(response) {
    console.log("Status Code:", response.status);
    console.log("Response Data:", response.data);
}

// Helper function to print errors
function printError(error) {
    if (error.response) {
        console.log("Error Status Code:", error.response.status);
        console.log("Error Response Data:", error.response.data);
    } else {
        console.log("Error:", error.message);
    }
}

// 1. Create Multiple Records
async function createManyUsers() {
    const url = `${BASE_URL}/users/many`;
    const payload = [
        {name: "Alice", email: "alice@example.com", age: 30},
        {name: "Bob", email: "bob@example.com", age: 25}
    ];
    try {
        const response = await axios.post(url, payload, {headers: {'Content-Type': 'application/json'}});
        printResponse(response);
    } catch (error) {
        printError(error);
    }
}

// 2. Create a Single Record
async function createUser() {
    const url = `${BASE_URL}/users/`;
    const payload = {name: "Charlie", email: "charlie@example.com", age: 28};
    try {
        const response = await axios.post(url, payload, {headers: {'Content-Type': 'application/json'}});
        printResponse(response);
    } catch (error) {
        printError(error);
    }
}

// 3. Get Multiple Records
async function getUsers() {
    const url = `${BASE_URL}/users/`;
    try {
        const response = await axios.get(url);
        printResponse(response);
    } catch (error) {
        printError(error);
    }
}

// 4. Get a Single Record by ID
async function getUserById(userId) {
    const url = `${BASE_URL}/users/${userId}`;
    try {
        const response = await axios.get(url);
        printResponse(response);
    } catch (error) {
        printError(error);
    }
}

// 5. Get a Single Record Based on Conditions
async function getUserByCondition() {
    const url = `${BASE_URL}/users/one?where[age]=28`;
    try {
        const response = await axios.get(url);
        printResponse(response);
    } catch (error) {
        printError(error);
    }
}

// 6. Update or Create a Record
async function updateOrCreateUser() {
    const url = `${BASE_URL}/users/findOrCreate`;
    const payload = {name: "David", email: "david@example.com", age: 32};
    try {
        const response = await axios.put(url, payload, {headers: {'Content-Type': 'application/json'}});
        printResponse(response);
    } catch (error) {
        printError(error);
    }
}

// 7. Update a Record by ID
async function updateUserById(userId) {
    const url = `${BASE_URL}/users/${userId}`;
    const payload = {age: 29};
    try {
        const response = await axios.put(url, payload, {headers: {'Content-Type': 'application/json'}});
        printResponse(response);
    } catch (error) {
        printError(error);
    }
}

// 8. Delete a Record by ID
async function deleteUserById(userId) {
    const url = `${BASE_URL}/users/${userId}`;
    try {
        const response = await axios.delete(url);
        printResponse(response);
    } catch (error) {
        printError(error);
    }
}

// Example usage
(async () => {
    await createManyUsers();
    await createUser();
    await getUsers();
    // Replace 'userId' with an actual ID from your database
    const userId = "60d0fe4f5311236168a109ca";  // Example ID
    await getUserById(userId);
    await getUserByCondition();
    await updateOrCreateUser();
    await updateUserById(userId);
    await deleteUserById(userId);
})();

 ```

---

## 📊 Statistics Endpoint

Get statistical analysis for numeric and categorical fields.

> Describe your database: `GET http://localhost:3000/database/describe`

### Statistics example

 ```javascript
const options = {method: 'GET', headers: {'User-Agent': 'insomnia/2023.5.8'}};

fetch('http://localhost:5051/api/users/statistics?select=age%2Cmonthly_income%2Cdoctor_visits%2Ccountry', options)
    .then(response => response.json())
    .then(response => console.log(response))
    .catch(err => console.error(err));

```

Response example

 ```json
{
  "status": 200,
  "collection": "users",
  "message": "Get Many Success",
  "data": {
    "age": {
      "statistics": {
        "count": 20,
        "sum": 649,
        "mean": 32.45,
        "median": 32,
        "mode": [
          29
        ],
        "min": 22,
        "max": 45,
        "range": 23,
        "std": 6.445735024029455,
        "variance": 41.5475,
        "quartiles": {
          "Q1": 27.75,
          "Q2": 32,
          "Q3": 37.25
        },
        "iqr": 9.5
      }
    },
    "monthly_income": {
      "statistics": {
        "count": 20,
        "sum": 99400,
        "mean": 4970,
        "median": 5050,
        "mode": [
          4500,
          6800
        ],
        "min": 2800,
        "max": 7200,
        "range": 4400,
        "std": 1309.6182649917494,
        "variance": 1715100,
        "quartiles": {
          "Q1": 3925,
          "Q2": 5050,
          "Q3": 5925
        },
        "iqr": 2000
      }
    },
    "doctor_visits": {
      "statistics": {
        "count": 18,
        "sum": 39,
        "mean": 2.1666666666666665,
        "median": 2,
        "mode": [
          1
        ],
        "min": 1,
        "max": 4,
        "range": 3,
        "std": 1.0137937550497031,
        "variance": 1.0277777777777777,
        "quartiles": {
          "Q1": 1,
          "Q2": 2,
          "Q3": 3
        },
        "iqr": 2
      }
    },
    "country": {
      "statistics": {
        "mode": [
          "USA",
          "Canada",
          "UK",
          "Australia",
          "New Zealand",
          "Ireland",
          "Spain",
          "Germany",
          "France",
          "South Korea",
          "Italy",
          "Netherlands",
          "Japan",
          "Brazil",
          "South Africa",
          "Russia",
          "Mexico",
          "Argentina",
          "China",
          "India"
        ],
        "mostFrequent": [
          "USA",
          "Canada",
          "UK",
          "Australia",
          "New Zealand"
        ],
        "leastFrequent": [
          "USA",
          "Canada",
          "UK",
          "Australia",
          "New Zealand"
        ],
        "uniqueValues": [
          "USA",
          "Canada",
          "UK",
          "Australia",
          "New Zealand",
          "Ireland",
          "Spain",
          "Germany",
          "France",
          "South Korea",
          "Italy",
          "Netherlands",
          "Japan",
          "Brazil",
          "South Africa",
          "Russia",
          "Mexico",
          "Argentina",
          "China",
          "India"
        ]
      }
    }
  }
}

   ```

---

## 🤝 Contributing

Pull requests are welcome! For major changes, please open an issue first.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

[MIT](./LICENSE) © [Leganux](https://leganux.com)

---

<div align="center">

**ZeroAPIBackend** is an open-source project built and maintained by **[Leganux](https://leganux.com)**

We build tools that make developers' (and agents') lives simpler. ⚡

[![leganux.com](https://img.shields.io/badge/🌐%20Visit-leganux.com-blueviolet?style=for-the-badge)](https://leganux.com)

</div>
