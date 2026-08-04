# ZeroAPIBackend

The world's first API-ready database with a REST interface

ZeroAPIBackend is a CLI tool that allows you to instantly create a Database - REST API by simply running the "zeroAPI
run" command.

This database tool requires no database setup because it is also a database, and you don't need to define tables or
perform complex configurations. Everything is generated on the fly when you consume an endpoint, offering a hassle-free
solution for rapid API development for developers and data experts.

---

> **ZeroAPIBackend** is an open-source project by **[Leganux](https://leganux.com)** — visit us at **[leganux.com](https://leganux.com)**

---

## Use Cases

| Who | How |
|-----|-----|
| **Frontend developers** | Spin up a real REST API in seconds without writing any backend code. Ideal for prototyping and demos. |
| **Data analysts** | Import a JSON/CSV dataset, query it via REST, and get statistics (mean, median, std, quartiles) out of the box. |
| **Hackathon teams** | Full persistent backend in one command — no cloud setup, no config files. |
| **QA / testing** | Reproducible API fixtures using TingoDB or SQLite; reset data with a single `DELETE /api/:table/drop`. |
| **Internal tools** | Lightweight backend for dashboards, admin panels, and scripts that need a quick datastore. |
| **CI/CD pipelines** | SQLite flavor gives you a zero-dependency file-based backend that works anywhere Node.js runs. |
| **Education** | Teach REST API concepts without boilerplate — students can hit real endpoints immediately. |

---

## Features

* Automatic API Creation: Launch a fully functional REST API with a single command.
* No Database Setup Required: Avoid the complexities of setting up and managing a database.
* Dynamic Table Handling: Create, read, update, and delete records in any table without predefined schemas.
* Designed for Data Analysts: Obtain the data dictionary easily via an endpoint, and by running the CLI with the -d
  parameter, you can automatically generate a completely clean new database.
* Data Cleaning and Statistics Endpoints: Automatically obtain statistics like mean, median, mode, standard deviation,
  quartiles, etc.
* Frontend-Based Queries: Perform all queries directly from the frontend, without needing to write backend code or
  install any database engine.
* Advanced Security: Protect your queries with an ACL configuration JSON and JWT Bearer token-based authentication.
* Automatic public share endpoints across (ngrok plugin)
* **Multi-database support**: TingoDB (default, embedded), SQLite and MongoDB — selectable at startup with no code changes.

## Get started

#### Prerequisites

* Install node js 20+ and npm

### Install

````bash 
npm install -g zeroapibackend
````

---

## Database Flavors

ZeroAPIBackend supports three database backends that can be selected when the server starts. All of them expose the
same REST API — no code changes are needed.

| Flavor | When to use | How to identify |
|--------|-------------|-----------------|
| **TingoDB** (default) | Local development, zero config | Any plain name, e.g. `api`, `myproject` |
| **SQLite** | File-based persistence, CI/CD, edge | Path ending in `.sqlite` or `.db`, or prefixed with `sqlite:` |
| **MongoDB** | Production, cloud, replica sets | Connection string starting with `mongodb://` or `mongodb+srv://` |

### Selecting the flavor at startup

**Priority order:** CLI argument `--database` → environment variable `DATABASE` → default (`api` = TingoDB)

```bash
# TingoDB — default embedded DB (folder: ./local/api)
node app.js

# TingoDB — custom folder name
node app.js --database my_project

# SQLite — file path
node app.js --database /data/app.sqlite
node app.js --database ./local/app.db
node app.js --database sqlite:/data/app.sqlite

# MongoDB — connection string
node app.js --database mongodb://localhost:27017/mydb
node app.js --database mongodb+srv://user:pass@cluster.mongodb.net/mydb

# Custom port  (CLI arg or PORT env var)
node app.js --database /data/app.sqlite --port 4000
PORT=4000 DATABASE=/data/app.sqlite node app.js

# Rate limiting — default 3 req/s per IP, configurable
node app.js --rate-limit 10
RATE_LIMIT=10 node app.js

# With nodemon (dev)
npm run dev -- --database /data/app.sqlite
```

The startup banner shows the active flavor and connection string:

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

## Rate Limiting

A built-in rate limiter protects every endpoint. The default is **3 requests per second per IP**.

**Priority order:** CLI argument `--rate-limit` → environment variable `RATE_LIMIT` → default (`3`)

```bash
# Default (3 req/s)
node app.js

# Increase limit for internal/trusted environments
node app.js --rate-limit 60

# Via environment variable
RATE_LIMIT=60 node app.js
```

Requests that exceed the limit receive a `429 Too Many Requests` response:

```json
{ "status": 429, "message": "Too many requests, slow down." }
```

---

## Integration with API Gateways & Reverse Proxies

ZeroAPIBackend is designed to run as a **standalone microservice**. In production you will typically place it behind a gateway or reverse proxy that handles TLS, authentication aggregation, and routing. Below are the most common patterns.

---

### nginx (reverse proxy)

The simplest production setup: nginx terminates HTTPS and forwards traffic to ZeroAPIBackend on a private port.

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

## Schema Middleware (Validation)

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
node app.js --schema ./example.schema.json

# Environment variable
SCHEMA=./example.schema.json node app.js

# Combined with other options
node app.js --database /data/app.sqlite --port 4000 --schema ./schemas/api.schema.json

# With nodemon (dev)
npm run dev -- --schema ./example.schema.json
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

## How to use

### Run

To execute in default port 3000 and default database only run and then visit http://localhost:3000

````bash 
zeroAPI run
````

Or if you prefer define a custom port for example 5050 to execute and then visit http://localhost:5050

````bash 
zeroAPI run -p 5050
````

Or if you want to use a new custom clear datatable use -d + datatable name

````bash 
zeroAPI run -p 5050 -d erick
````

Or if you want to publish on internet your API using ngrok

````bash 
zeroAPI run -p 5050 -d erick -ngr <true or ngrok token string>
````

### Commands

### zeroAPI dump Command

Description
Dumps a specified database by name.

Options

* -d, --dir <dir...>: Full path directory where the dump will be saved.
* -n, --name <name...>: Database name.

Usage Example

```bash
zeroAPI dump --name myDatabase --dir /path/to/save/dump
```

### zeroAPI restore Command

Description
Restores a database from a specified ZIP file. 

**Note :This function will replace all registers in the target database.

Options

* -d, --dir <dir...>: Full path directory of the source ZIP file.
* -n, --name <name...>: Database name.
  Usage Example

```bash
zeroAPI restore --name myDatabase --dir /path/to/zip/file.zip
```

### zeroAPI drop Command

Description
Drops a specified database by name.

Options

* -n, --name <name...>: Database name.

Usage Example

```bash
zeroAPI drop --name myDatabase
```

### Endpoints

- Create Multiple Records:
    - POST /api/:table/many
        - Description: Create multiple records in the specified table.


- Create a Single Record:
    - POST /api/:table/
        - Description: Create a single record in the specified table.


- Get Multiple Records:
    - GET /api/:table/
        - Description: Retrieve multiple records from the specified table.


- Get a Single Record Based on Conditions:
    - GET /api/:table/one
        - Description: Retrieve a single record from the specified table that meets the specified conditions.


- Get a Single Record by ID:
    - GET /api/:table/:id
        - Description: Retrieve a single record by its ID from the specified table.


- Update or Create a Record:
    - PUT /api/:table/findOrCreate
        - Description: Update an existing record or create a new one in the specified table.


- Update a Record by ID:
    - PUT /api/:table/:id
        - Description: Update a record by its ID in the specified table.


- Update Records Based on Conditions:
    - PUT /api/:table/
        - Description: Update records in the specified table that meet the specified conditions.


- Delete a Record by ID:
    - DELETE /api/:table/:id
        - Description: Delete a record by its ID from the specified table.

- Get statistics like mean, mode, avg, etc of a field:
    - GET /api/:table/statistics?select=< fields comma separed >
        - Description: gets statisctics from a column in query

### Query parameters

To use query parameters in the API routes, you can specify various parameters in the URL that will modify the behavior
of the CRUD operations. Below are some examples of how to use these parameters:

1. select: Field Selection
   The select parameter is used to specify the fields you want to include in the response.

   Example: Retrieve only the name and email fields from the records in the users table:

```bash 
curl -X GET "http://localhost:3000/api/users/?select=name,email"
```

2. where: Specific Conditions
   The where parameter is used to filter records based on certain conditions.

   Example: Retrieve all records from the users table where age is equal to 30:

```bash 
curl -X GET "http://localhost:3000/api/users/?where[age]=30"
```

3. paginate: Pagination
   The paginate parameter is used to paginate the results, specifying the number of records per page and the page
   number.

   Example: Retrieve the second page of records from the users table, with 10 records per page:

```bash 
curl -X GET "http://localhost:3000/api/users/?paginate[limit]=10&paginate[page]=1"
```

4. sort: Sorting
   The sort parameter is used to sort the results based on one or more fields.

   Example: Retrieve all records from the users table sorted by createdAt in descending order:

```bash 
curl -X GET "http://localhost:3000/api/users/?sort[createdAt]=-1"
```

5. populate: Relationships
   The populate parameter is used to include related documents from other collections.

   Example: Retrieve all records from the orders table and include the details of the related users:

```bash 
curl -X GET "http://localhost:3000/api/orders/?populate[localFields]=userId&populate[tables]=users&populate[foreignFields]=_id"

```

### Combined Examples

You can combine several query parameters to perform more complex queries.

Example: Retrieve the first page of records from the users table, with 5 records per page, only the name and email
fields, sorted by createdAt in ascending order, and where age is equal to 25:

```bash 
curl -X GET "http://localhost:3000/api/users/?select=name,email&paginate[limit]=5&paginate[page]=0&sort[createdAt]=1&where[age]=25"
```

### Usage in Create Operations

You can use select, populate, and other parameters in create operations to specify which fields to include in the
response and how to relate the new documents.

Example: Create a new record in the users table and return only the name and email fields:

```bash 
curl -X POST "http://localhost:3000/api/users/?select=name,email" -H "Content-Type: application/json" -d '{
    "name": "Jane Doe",
    "email": "jane.doe@example.com",
    "age": 28
}'

```

## Detailed Explanation of How Populates Work in the Library

The populateConstructor function is used to fetch related data from other tables and incorporate it into the main query
result. This mimics the behavior of SQL joins in a NoSQL database by manually linking documents based on specified
fields.

## How populateConstructor Works

1. Parameter Parsing:

The populate object contains localFields, tables, and foreignFields, which are comma-separated strings specifying the
fields and tables involved in the population.
These strings are split into arrays for further processing.

2. Iteration Over Records:

For each item in the list_of_elements (the main query result), the function iterates over the specified fields and
tables.
For each field-table combination, a filter is constructed to match the related documents in the foreign table.

3. Filter Construction:

If the value of the localField in the current item is a string, a simple equality filter is created.
If the value is an array, an $in filter is created to match any of the values in the array.

4. Field Selection:

If populateFields are specified, only the indicated fields are selected from the foreign table.

5. Database Query:

The function initializes the connection to the foreign table and executes the query with the constructed filter and
field selection.
The results are stored back into the original item, replacing the localField value with the related documents.

6. Final Assembly:

The populated items are collected into a new array and returned.
Example of Using Populates in CLI
To use the populate parameter in your CLI to fetch related data from other tables, follow this example:

## Scenario

You have two collections: orders and users. Each order document has a userId field referencing a user. You want to
retrieve orders and include user details in the result.

```bash 
curl -X GET "http://localhost:3000/api/orders/?populate[localFields]=userId&populate[tables]=users&populate[foreignFields]=_id"
```

### How the Example Works

1. Query URL:

* The URL specifies the orders table and includes the populate parameter with localFields, tables, and foreignFields.
* localFields=userId: Indicates the field in the orders collection that references the users collection.
* tables=users: Specifies the foreign table (users) to fetch data from.
* foreignFields=_id: Specifies the field in the users collection that matches the userId field in the orders collection.

2. Result:

* The server will process the request, fetch orders, and for each order, it will look up the corresponding user in the
  users collection.
* The userId in each order will be replaced with the full user document.

## Extended Example with Field Selection

You can also specify which fields to include from the related documents using populateFields.

Example Command

```bash 
curl -X GET "http://localhost:3000/api/orders/?populate[localFields]=userId&populate[tables]=users&populate[foreignFields]=_id&populateFields[users]=name,email"
```

### How the Extended Example Works

1. Query URL:

* The URL includes an additional populateFields parameter specifying which fields to include from the users collection.
  populateFields[users]=name,email: Indicates that only the name and email fields from the users collection should be
  included in the response.

2. Result:

* The server will fetch orders and populate the userId field with user documents that include only the name and email
  fields.

## Full example  for python

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

## Full example  for javascript

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

## If you want to get information from database

Visit GET : http://localhost:3000/database/describe

## Example of statistics endpoint

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

## About

ZeroAPIBackend is an open-source project built and maintained by **[Leganux](https://leganux.com)**.

We build tools that make developers' lives simpler. If you find ZeroAPIBackend useful, check out our other projects and resources at **[leganux.com](https://leganux.com)**.

### Contributing

Pull requests are welcome. For major changes please open an issue first to discuss what you would like to change.

### License

[MIT](./LICENSE) © Leganux
