<div align="center">

# ⚡ ZeroAPIBackend

### *El backend instantáneo para humanos y agentes de IA.*

[![npm version](https://img.shields.io/npm/v/zeroapibackend?color=blueviolet&style=for-the-badge&logo=npm)](https://www.npmjs.com/package/zeroapibackend)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](./LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-20%2B-green?style=for-the-badge&logo=node.js)](https://nodejs.org)
[![Hecho por Leganux](https://img.shields.io/badge/Hecho%20por-Leganux-ff69b4?style=for-the-badge)](https://leganux.com)

> **Una API REST completa + base de datos, funcionando en menos de 60 segundos.**
> **Cero configuración. Cero código repetitivo. Cero excusas.**

[🚀 Inicio Rápido](#️-inicio-rápido-1-minuto) · [📖 Docs](#️-cómo-usar) · [🌐 English](./README.md) · [🤝 Contribuir](#-contribuir)

</div>

---

## 🧠 ¿Por qué "para humanos Y agentes de IA"?

La mayoría de las herramientas backend fueron diseñadas para un solo tipo de usuario: el desarrollador que lee documentación, escribe código y configura cosas manualmente. Pero el mundo ha cambiado.

Hoy existen **dos tipos de constructores**:

| 👤 Humanos | 🤖 Agentes de IA |
|-----------|-----------------|
| Devs frontend que necesitan un backend rápido | LLMs y agentes autónomos que llaman APIs REST para almacenar y recuperar datos |
| Analistas de datos que quieren consultar un dataset | Pipelines de IA que necesitan un datastore persistente sin esquema |
| Equipos de hackathon que necesitan un backend *ya* | Herramientas de generación de código que necesitan un endpoint API en vivo |
| Educadores enseñando conceptos REST | Flujos autónomos (LangChain, CrewAI, AutoGPT…) que necesitan memoria/estado |

**ZeroAPIBackend habla fluidamente con ambos.** Un humano ejecuta un comando. Un agente de IA lanza peticiones HTTP. El backend simplemente funciona — sin esquemas que definir, sin migraciones que ejecutar, sin archivos de configuración que escribir.

> 💡 El nombre es una declaración: este backend no se preocupa *quién* lo está llamando. Ya sea un desarrollador curioso o un bucle de función GPT-4, ZeroAPI responde al instante.

---

## ⏱️ Inicio Rápido: 1 Minuto

> De cero a una API REST en vivo con base de datos real en **menos de 60 segundos**. En serio.

```bash
# Paso 1 — Instalar (solo una vez)
npm install -g zeroapibackend

# Paso 2 — Lanzar 🚀
zeroAPI run
```

✅ Tu API está en vivo en **http://localhost:3000**

```bash
# Pruébala inmediatamente — sin tablas que crear, sin esquema que definir:
curl -X POST http://localhost:3000/api/usuarios/ \
  -H "Content-Type: application/json" \
  -d '{"nombre": "Alicia", "email": "alicia@ejemplo.com", "edad": 30}'

# Léela de vuelta:
curl http://localhost:3000/api/usuarios/
```

> 🎉 **Una API REST CRUD completa con almacenamiento persistente ya está corriendo.**
> Sin servidor de base de datos. Sin ORM. Sin archivos de configuración. Solo un comando.

---

## 🗂️ Tabla de Contenidos

- [¿Por qué humanos y agentes de IA?](#-por-qué-para-humanos-y-agentes-de-ia)
- [Inicio Rápido](#️-inicio-rápido-1-minuto)
- [Características](#-características)
- [Casos de Uso](#-casos-de-uso)
- [Sabores de Base de Datos](#️-sabores-de-base-de-datos)
- [Limitación de Tasa](#️-limitación-de-tasa)
- [Integración con Gateways y Proxies](#-integración-con-api-gateways-y-proxies-inversos)
- [Validación de Esquema](#-validación-de-esquema)
- [Cómo Usar](#️-cómo-usar)
- [Endpoints](#-endpoints)
- [Parámetros de Consulta](#-parámetros-de-consulta)
- [Cómo Funcionan los Populates](#-cómo-funcionan-los-populates)
- [Ejemplos Completos](#-ejemplos-completos)
- [Estadísticas](#-endpoint-de-estadísticas)
- [Contribuir](#-contribuir)

---

## ✨ Características

- ⚡ **API REST instantánea** — lanza una API completamente funcional con un solo comando
- 🗄️ **Sin configuración de base de datos** — la base de datos está integrada; las tablas se crean al vuelo
- 🔄 **Manejo dinámico de tablas** — CRUD en cualquier tabla, en cualquier momento, sin esquemas predefinidos
- 🤖 **Listo para agentes de IA** — endpoints sin esquema que cualquier LLM o agente autónomo puede consumir via HTTP
- 📊 **Endpoints de estadísticas** — media, mediana, moda, desviación estándar, varianza, cuartiles integrados
- 🔐 **Seguridad avanzada** — configuración ACL + autenticación JWT Bearer token
- 🌍 **Compartir públicamente** — expone tu API local a internet via integración con ngrok
- 🧩 **Soporte multi-base de datos** — TingoDB (integrada), SQLite y MongoDB
- 🛡️ **Limitación de tasa** — throttling por IP integrado (por defecto 3 req/s, configurable)
- 🧹 **Limpieza de datos** — importa datasets JSON/CSV y limpia via REST
- 📐 **Validación de esquema** — capa opcional de validación de peticiones basada en JSON

---
## 🎯 Casos de Uso

| Quién | Cómo |
|-------|------|
| 👨‍💻 **Desarrolladores frontend** | Levanta una API REST real en segundos sin escribir código backend. Ideal para prototipos y demos. |
| 📊 **Analistas de datos** | Importa un dataset JSON/CSV, consúltalo via REST y obtén estadísticas de serie. |
| 🏆 **Equipos de hackathon** | Backend persistente completo en un comando — sin configuración cloud, sin archivos de config. |
| 🧪 **QA / Testing** | Fixtures de API reproducibles usando TingoDB o SQLite; resetea datos con `DELETE /api/:tabla/drop`. |
| 🛠️ **Herramientas internas** | Backend ligero para dashboards, paneles de admin y scripts. |
| 🔁 **Pipelines CI/CD** | El sabor SQLite te da un backend basado en archivos sin dependencias. |
| 🎓 **Educación** | Enseña conceptos de API REST sin boilerplate. |
| 🤖 **Agentes de IA** | LLMs, LangChain, AutoGPT, CrewAI — cualquier agente HTTP obtiene memoria persistente instantánea. |

---

## 🗄️ Sabores de Base de Datos

| Sabor | Cuándo usar | Cómo identificar |
|-------|-------------|-----------------|
| 🟢 **TingoDB** (default) | Desarrollo local, cero config | Nombre simple, ej. `api`, `miproyecto` |
| 🔵 **SQLite** | Persistencia en archivo, CI/CD | Ruta `.sqlite` o `.db`, o prefijo `sqlite:` |
| 🟠 **MongoDB** | Producción, cloud | Cadena `mongodb://` o `mongodb+srv://` |

```bash
zeroAPI run                                                    # TingoDB por defecto
zeroAPI run --database /data/app.sqlite                        # SQLite
zeroAPI run --database mongodb://localhost:27017/mibd          # MongoDB
PORT=4000 DATABASE=/data/app.sqlite zeroAPI run                # Puerto y BD via env
RATE_LIMIT=10 zeroAPI run                                      # Límite de tasa
```

---

## 🛡️ Limitación de Tasa

Por defecto: **3 peticiones por segundo por IP**.

```bash
zeroAPI run --rate-limit 60    # Límite personalizado
RATE_LIMIT=60 zeroAPI run      # Via variable de entorno
```

Las peticiones excedidas reciben `429 Too Many Requests`.

---

## 🌐 Integración con Gateways y Proxies

### nginx

```nginx
server {
    listen 443 ssl;
    server_name api.ejemplo.com;
    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Docker Compose

```yaml
version: "3.9"
services:
  zeroapi:
    image: node:20-alpine
    command: sh -c "npm install -g zeroapibackend && zeroAPI run"
    ports: ["3000:3000"]
    environment:
      DATABASE: /data/app.sqlite
      PORT: 3000
    volumes: ["./data:/data"]
```

---

## 📐 Validación de Esquema

```bash
zeroAPI run --schema ./mi_esquema.json
```

```jsonc
{
  "resources": [
    {
      "path": "/api/usuarios",
      "ops": ["createOne", "getAll", "getOne", "updateOne", "deleteOne"],
      "fields": {
        "nombre": { "type": "string", "required": true },
        "email":  { "type": "string", "required": true, "format": "email" },
        "edad":   { "type": "number", "minimum": 0, "maximum": 120 }
      }
    },
    { "path": "/api/productos", "ops": "*",            "fields": "**" },
    { "path": "/api/temas",     "ops": ["-deleteOne"], "fields": "**" }
  ]
}
```

| Valor `ops` | Significado |
|-------------|-------------|
| `"*"` | Todas las operaciones |
| `["createOne", "getAll"]` | Solo las listadas |
| `["-deleteOne"]` | Todas excepto las indicadas |

---


## 🛠️ Cómo Usar

### Instalar

```bash
npm install -g zeroapibackend
```

### Ejecutar

```bash
zeroAPI run                                         # Puerto 3000, TingoDB
zeroAPI run -p 5050 -d miproyecto                   # Puerto y BD personalizados
zeroAPI run -p 5050 -d miproyecto -ngr true         # + Exponer via ngrok
```

### Comandos CLI

```bash
zeroAPI dump    --name miDB --dir /ruta/guardar     # Respaldar
zeroAPI restore --name miDB --dir /ruta/archivo.zip # Restaurar (⚠️ reemplaza datos)
zeroAPI drop    --name miDB                         # Eliminar BD
```

---

## 🔌 Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/api/:tabla/many` | Crear múltiples registros |
| `POST` | `/api/:tabla/` | Crear un registro |
| `GET` | `/api/:tabla/` | Obtener múltiples registros |
| `GET` | `/api/:tabla/one` | Obtener uno por condición |
| `GET` | `/api/:tabla/:id` | Obtener por ID |
| `PUT` | `/api/:tabla/findOrCreate` | Actualizar o crear |
| `PUT` | `/api/:tabla/:id` | Actualizar por ID |
| `PUT` | `/api/:tabla/` | Actualizar por condición |
| `DELETE` | `/api/:tabla/:id` | Eliminar por ID |
| `DELETE` | `/api/:tabla/drop` | Vaciar toda la tabla |
| `GET` | `/api/:tabla/statistics` | Estadísticas |
| `GET` | `/database/describe` | Describir colecciones |

---

## 🔍 Parámetros de Consulta

```bash
# Selección de campos
curl "http://localhost:3000/api/usuarios/?select=nombre,email"

# Filtrado
curl "http://localhost:3000/api/usuarios/?where[edad]=28"

# Paginación
curl "http://localhost:3000/api/usuarios/?paginate[limit]=10&paginate[page]=1"

# Ordenamiento
curl "http://localhost:3000/api/usuarios/?sort[createdAt]=-1"

# Populate (unir colecciones)
curl "http://localhost:3000/api/pedidos/?populate[localFields]=userId&populate[tables]=usuarios&populate[foreignFields]=_id"

# Combinado
curl "http://localhost:3000/api/usuarios/?select=nombre,email&paginate[limit]=5&where[edad]=25&sort[createdAt]=1"
```

---

## 🔗 Cómo Funcionan los Populates

La función `populateConstructor` obtiene datos relacionados de otras tablas — imitando los JOINs de SQL en un entorno sin esquema.

```bash
# Populate básico
curl "http://localhost:3000/api/pedidos/?populate[localFields]=userId&populate[tables]=usuarios&populate[foreignFields]=_id"

# Con selección de campos
curl "http://localhost:3000/api/pedidos/?populate[localFields]=userId&populate[tables]=usuarios&populate[foreignFields]=_id&populateFields[usuarios]=nombre,email"
```

---

## 💻 Ejemplos Completos

### Python

```python
import requests

BASE = "http://localhost:3000/api"

requests.post(f"{BASE}/usuarios/many", json=[
    {"nombre": "Alicia", "email": "alicia@ejemplo.com", "edad": 30},
    {"nombre": "Roberto", "email": "roberto@ejemplo.com", "edad": 25}
])
requests.post(f"{BASE}/usuarios/", json={"nombre": "Carlos", "email": "carlos@ejemplo.com", "edad": 28})
requests.get(f"{BASE}/usuarios/")
requests.get(f"{BASE}/usuarios/60d0fe4f5311236168a109ca")
requests.put(f"{BASE}/usuarios/findOrCreate", json={"nombre": "David", "email": "david@ejemplo.com"})
requests.put(f"{BASE}/usuarios/60d0fe4f5311236168a109ca", json={"edad": 29})
requests.delete(f"{BASE}/usuarios/60d0fe4f5311236168a109ca")
```

### JavaScript (axios)

```javascript
const axios = require('axios');
const BASE = "http://localhost:3000/api";

await axios.post(`${BASE}/usuarios/many`, [
    { nombre: "Alicia", email: "alicia@ejemplo.com", edad: 30 },
    { nombre: "Roberto", email: "roberto@ejemplo.com", edad: 25 }
]);
await axios.post(`${BASE}/usuarios/`, { nombre: "Carlos", email: "carlos@ejemplo.com", edad: 28 });
await axios.get(`${BASE}/usuarios/`);
await axios.put(`${BASE}/usuarios/findOrCreate`, { nombre: "David", email: "david@ejemplo.com" });
await axios.put(`${BASE}/usuarios/60d0fe4f5311236168a109ca`, { edad: 29 });
await axios.delete(`${BASE}/usuarios/60d0fe4f5311236168a109ca`);
```

---

## 📊 Endpoint de Estadísticas

```bash
curl "http://localhost:3000/api/usuarios/statistics?select=edad,ingreso_mensual,pais"
```

```json
{
  "status": 200,
  "collection": "usuarios",
  "data": {
    "edad": {
      "statistics": {
        "count": 20, "mean": 32.45, "median": 32,
        "mode": [29], "min": 22, "max": 45, "std": 6.44,
        "quartiles": { "Q1": 27.75, "Q2": 32, "Q3": 37.25 }
      }
    },
    "pais": {
      "statistics": {
        "mostFrequent": ["México", "España", "Argentina"],
        "uniqueValues": ["México", "España", "Argentina", "..."]
      }
    }
  }
}
```

```bash
# Describir tu base de datos
curl http://localhost:3000/database/describe
```

---

## 🤝 Contribuir

¡Los pull requests son bienvenidos!

1. Fork del repositorio
2. Crea tu rama (`git checkout -b feature/nueva-funcionalidad`)
3. Commitea (`git commit -m 'Agrega nueva funcionalidad'`)
4. Sube la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

---

## 📄 Licencia

[MIT](./LICENSE) © [Leganux](https://leganux.com)

---

<div align="center">

**ZeroAPIBackend** es un proyecto open-source construido y mantenido por **[Leganux](https://leganux.com)**

Construimos herramientas que hacen la vida de los desarrolladores (¡y los agentes!) más simple. ⚡

[![leganux.com](https://img.shields.io/badge/🌐%20Visitar-leganux.com-blueviolet?style=for-the-badge)](https://leganux.com)

</div>

