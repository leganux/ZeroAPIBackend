/**
 * schema.middleware.js — Middleware de validación de esquema para ZeroAPIBackend
 *
 * Se activa cuando el servidor arranca con la opción --schema <path>.
 * Valida cada request contra el esquema JSON definido, controlando:
 *
 *   1. ¿Existe el recurso (/api/:table) en el esquema?  → 403 si no existe
 *   2. ¿Está permitida la operación (createOne, getAll…)? → 403 si no está permitida
 *   3. ¿El body cumple las reglas de campos definidos?    → 400 si falla validación
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * Formato del schema JSON
 * ─────────────────────────────────────────────────────────────────────────────
 * {
 *   "version": "1.0",
 *   "title": "Mi API",
 *   "paths": [
 *     {
 *       "path": "/api/users",          ← ruta base (sin trailing slash)
 *       "ops": ["createOne","getAll"], ← lista de ops permitidas
 *       "ops": "*",                    ← todas las ops permitidas
 *       "ops": ["-deleteOne"],         ← todas EXCEPTO deleteOne (prefijo -)
 *       "fields": {                    ← definición de campos
 *         "name":  { "type": "string", "required": true },
 *         "email": { "type": "string", "required": true, "format": "email" },
 *         "age":   { "type": "number", "minimum": 0, "maximum": 120 }
 *       },
 *       "fields": "**"                 ← cualquier campo es válido (sin validación)
 *     }
 *   ]
 * }
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * Operaciones reconocidas
 * ─────────────────────────────────────────────────────────────────────────────
 *  createOne      POST   /api/:table/
 *  createMany     POST   /api/:table/many
 *  getAll         GET    /api/:table/
 *  getOne         GET    /api/:table/:id
 *  getOneWhere    GET    /api/:table/one
 *  updateOne      PUT    /api/:table/:id
 *  updateMany     PUT    /api/:table/
 *  updateOrCreate PUT    /api/:table/findOrCreate
 *  deleteOne      DELETE /api/:table/:id
 *  drop           DELETE /api/:table/drop
 *  statistics     GET    /api/:table/statistics
 *  xlsx           GET    /api/:table/xlsx
 *  split          POST   /api/:table/split
 *  json           POST   /api/:table/json
 *  transform      POST   /api/:table/transform/:to
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * Reglas de campos soportadas
 * ─────────────────────────────────────────────────────────────────────────────
 *  type        string | number | boolean | array | object
 *  required    true | false
 *  format      email | url | date | uuid
 *  minLength   número (sólo string)
 *  maxLength   número (sólo string)
 *  pattern     regex string (sólo string)
 *  enum        array de valores permitidos
 *  minimum     número (sólo number)
 *  maximum     número (sólo number)
 */

'use strict';

const fs   = require('fs');
const path = require('path');

// ─────────────────────────────────────────────────────────────────────────────
// Helpers internos
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Lee y parsea el archivo de schema.
 * Soporta comentarios de una sola línea (//) antes de parsear.
 */
function _loadSchema(schemaPath) {
    const absPath = path.resolve(schemaPath);
    if (!fs.existsSync(absPath)) {
        throw new Error(`[Schema] Archivo no encontrado: ${absPath}`);
    }
    const raw     = fs.readFileSync(absPath, 'utf8');
    // Eliminar comentarios // (no dentro de strings, suficiente para uso práctico)
    const cleaned = raw.replace(/\/\/[^\n\r]*/g, '');
    try {
        return JSON.parse(cleaned);
    } catch (e) {
        throw new Error(`[Schema] JSON inválido en ${absPath}: ${e.message}`);
    }
}

/**
 * Mapea método HTTP + ruta a nombre de operación.
 * Trabaja sobre req.path (sin query string).
 */
function _detectOperation(method, reqPath) {
    const m    = method.toUpperCase();
    const segs = reqPath.split('/').filter(Boolean); // ['api', 'table', 'maybe-subpath']
    const sub  = segs[2] || '';  // tercer segmento, si existe

    switch (m) {
        case 'POST':
            if (sub === 'many')      return 'createMany';
            if (sub === 'split')     return 'split';
            if (sub === 'json')      return 'json';
            if (sub === 'xlsx')      return 'xlsx';
            if (sub === 'transform') return 'transform';
            return 'createOne';

        case 'GET':
            if (sub === 'statistics') return 'statistics';
            if (sub === 'xlsx')       return 'xlsx';
            if (sub === 'one')        return 'getOneWhere';
            if (sub !== '')           return 'getOne';   // /api/table/:id
            return 'getAll';

        case 'PUT':
        case 'PATCH':
            if (sub === 'findOrCreate') return 'updateOrCreate';
            if (sub !== '')             return 'updateOne';
            return 'updateMany';

        case 'DELETE':
            if (sub === 'drop') return 'drop';
            return 'deleteOne';
    }
    return null;
}

/**
 * Comprueba si una operación está permitida según la definición `ops`.
 *
 *  ops = "*"             → todas permitidas
 *  ops = ["a", "b"]     → solo a y b
 *  ops = ["-c", "-d"]   → todas excepto c y d
 *  ops = ["a", "-b"]    → sólo a (si mezclan, prevalece la inclusión explícita)
 */
function _isOperationAllowed(pathDef, operation) {
    if (!operation) return true;     // operación no reconocida → no bloqueamos

    const ops = pathDef.ops;
    if (ops === '*') return true;
    if (!Array.isArray(ops) || ops.length === 0) return false;

    const exclusions = ops.filter(o => typeof o === 'string' && o.startsWith('-')).map(o => o.slice(1));
    const inclusions = ops.filter(o => typeof o === 'string' && !o.startsWith('-'));

    if (inclusions.length > 0) {
        // Modo inclusión: sólo las ops listadas están permitidas
        return inclusions.includes(operation);
    }

    // Modo exclusión: todo permitido excepto las excluidas
    return !exclusions.includes(operation);
}

// ─────────────────────────────────────────────────────────────────────────────
// Validación de campos
// ─────────────────────────────────────────────────────────────────────────────

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID_RE  = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE_RE  = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})?)?$/;

/**
 * Valida un único documento contra la definición de fields.
 * @returns {{ valid: boolean, errors: string[] }}
 */
function _validateDoc(doc, fields) {
    const errors = [];

    for (const [fieldName, rule] of Object.entries(fields)) {
        const value = doc[fieldName];
        const absent = value === undefined || value === null || value === '';

        // ── required ──────────────────────────────────────────
        if (rule.required && absent) {
            errors.push(`El campo '${fieldName}' es requerido`);
            continue;
        }
        if (absent) continue;   // opcional y ausente → ok

        // ── type ──────────────────────────────────────────────
        if (rule.type) {
            const actualType = Array.isArray(value) ? 'array' : typeof value;
            if (actualType !== rule.type) {
                errors.push(`El campo '${fieldName}' debe ser de tipo '${rule.type}', se recibió '${actualType}'`);
                continue;
            }
        }

        // ── validaciones de string ─────────────────────────────
        if (typeof value === 'string') {
            if (rule.format === 'email'  && !EMAIL_RE.test(value))
                errors.push(`El campo '${fieldName}' debe ser un email válido`);

            if (rule.format === 'url') {
                try { new URL(value); }
                catch { errors.push(`El campo '${fieldName}' debe ser una URL válida`); }
            }

            if (rule.format === 'uuid' && !UUID_RE.test(value))
                errors.push(`El campo '${fieldName}' debe ser un UUID válido`);

            if (rule.format === 'date' && !DATE_RE.test(value))
                errors.push(`El campo '${fieldName}' debe ser una fecha ISO 8601 válida`);

            if (rule.minLength !== undefined && value.length < rule.minLength)
                errors.push(`El campo '${fieldName}' debe tener al menos ${rule.minLength} caracteres`);

            if (rule.maxLength !== undefined && value.length > rule.maxLength)
                errors.push(`El campo '${fieldName}' debe tener como máximo ${rule.maxLength} caracteres`);

            if (rule.pattern !== undefined && !new RegExp(rule.pattern).test(value))
                errors.push(`El campo '${fieldName}' no cumple el patrón '${rule.pattern}'`);

            if (rule.enum !== undefined && !rule.enum.includes(value))
                errors.push(`El campo '${fieldName}' debe ser uno de: ${rule.enum.join(', ')}`);
        }

        // ── validaciones de number ─────────────────────────────
        if (typeof value === 'number') {
            if (rule.minimum !== undefined && value < rule.minimum)
                errors.push(`El campo '${fieldName}' debe ser >= ${rule.minimum}`);

            if (rule.maximum !== undefined && value > rule.maximum)
                errors.push(`El campo '${fieldName}' debe ser <= ${rule.maximum}`);

            if (rule.enum !== undefined && !rule.enum.includes(value))
                errors.push(`El campo '${fieldName}' debe ser uno de: ${rule.enum.join(', ')}`);
        }
    }

    return { valid: errors.length === 0, errors };
}

/**
 * Valida el body (doc único o array de docs) contra los fields del schema.
 * @returns {{ valid: boolean, errors: string[] }}
 */
function _validateBody(body, fields, operation) {
    if (!body)             return { valid: true,  errors: [] };
    if (fields === '**')   return { valid: true,  errors: [] };
    if (!fields)           return { valid: true,  errors: [] };

    const isMany = operation === 'createMany';
    const docs   = isMany ? (Array.isArray(body) ? body : [body]) : [body];

    const allErrors = [];
    docs.forEach((doc, i) => {
        const { errors } = _validateDoc(doc, fields);
        errors.forEach(e => allErrors.push(isMany ? `[${i}] ${e}` : e));
    });

    return { valid: allErrors.length === 0, errors: allErrors };
}

// ─────────────────────────────────────────────────────────────────────────────
// Punto de entrada público
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Crea y devuelve el middleware de validación de esquema.
 *
 * @param {string} schemaPath  Ruta absoluta o relativa al archivo JSON del schema.
 * @returns {function}         Middleware Express (req, res, next)
 */
function createSchemaMiddleware(schemaPath) {
    const schema = _loadSchema(schemaPath);

    // Mapa rápido basePath → pathDef
    const pathMap = {};
    for (const p of schema.paths) {
        const key = p.path.replace(/\/$/, '');
        pathMap[key] = p;
    }

    const pathCount = Object.keys(pathMap).length;
    console.log(`[Schema] ✓ Cargado: "${schema.title || schemaPath}"  (${pathCount} ruta(s))`);

    return function schemaMiddleware(req, res, next) {
        // Sólo aplica a rutas /api/*
        if (!req.path.startsWith('/api/')) return next();

        const segs     = req.path.split('/').filter(Boolean); // ['api', 'table', ...]
        if (segs.length < 2) return next();

        const basePath = '/' + segs[0] + '/' + segs[1];  // /api/:table
        const pathDef  = pathMap[basePath];

        // ── 1. Recurso no definido en el schema ───────────────
        if (!pathDef) {
            return res.status(403).json({
                status:  403,
                message: 'Acceso denegado: el recurso no está definido en el schema',
                resource: basePath
            });
        }

        // ── 2. Operación no permitida ──────────────────────────
        const operation = _detectOperation(req.method, req.path);

        if (!_isOperationAllowed(pathDef, operation)) {
            return res.status(403).json({
                status:    403,
                message:   `Acceso denegado: la operación '${operation}' no está permitida en este recurso`,
                resource:  basePath,
                operation
            });
        }

        // ── 3. Validación del body (ops de escritura) ──────────
        const WRITE_METHODS = ['POST', 'PUT', 'PATCH'];
        if (WRITE_METHODS.includes(req.method.toUpperCase()) && req.body) {
            const { valid, errors } = _validateBody(req.body, pathDef.fields, operation);
            if (!valid) {
                return res.status(400).json({
                    status:    400,
                    message:   'Error de validación',
                    resource:  basePath,
                    operation,
                    errors
                });
            }
        }

        next();
    };
}

module.exports = { createSchemaMiddleware };
