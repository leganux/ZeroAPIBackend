/**
 * database.js — Capa de abstracción de base de datos
 *
 * Detecta automáticamente el tipo de BD a partir del valor de `database`
 * y delega al adaptador correspondiente:
 *
 *  ┌───────────────────────────────────────────────────────────────┐
 *  │  Tipo        │ Cómo se detecta          │ Ejemplo             │
 *  ├───────────────────────────────────────────────────────────────┤
 *  │  TingoDB     │ cualquier string simple   │  'api'              │
 *  │  (default)   │ (sin prefijo/extensión)   │  'mi_proyecto'      │
 *  ├───────────────────────────────────────────────────────────────┤
 *  │  SQLite      │ termina en .sqlite / .db  │  '/data/app.sqlite' │
 *  │  (Sequelize) │ o empieza con  sqlite:    │  'sqlite:/tmp/a.db' │
 *  ├───────────────────────────────────────────────────────────────┤
 *  │  MongoDB     │ empieza con mongodb://    │  'mongodb://...'    │
 *  │  (Mongoose)  │ o mongodb+srv://          │  'mongodb+srv://...'│
 *  └───────────────────────────────────────────────────────────────┘
 *
 * Los tres adaptadores devuelven un objeto con la misma API callback
 * que usaban los controladores originales:
 *
 *   collection.find(filter, projection)  →  QueryBuilder { .sort .limit .skip .toArray(cb) }
 *   collection.insert(doc|docs, cb)
 *   collection.update(filter, op, opts, cb)
 *   collection.remove(filter, opts, cb)
 *
 * Así los controladores (api.controller.js, core.controller.js, etc.)
 * no requieren ningún cambio.
 */

const {getTingoCollection} = require('./adapters/tingodb.adapter');
const {getSQLiteCollection} = require('./adapters/sqlite.adapter');
const {getMongooseCollection} = require('./adapters/mongoose.adapter');

/**
 * Detecta el tipo de base de datos a partir del string `database`.
 * @param {string} database
 * @returns {'mongoose' | 'sqlite' | 'tingodb'}
 */
function _detectDbType(database) {
    if (typeof database === 'string') {
        // MongoDB — connection string nativo o mongoose
        if (
            database.startsWith('mongodb://') ||
            database.startsWith('mongodb+srv://')
        ) {
            return 'mongoose';
        }

        // SQLite — ruta a archivo con extensión reconocida o prefijo sqlite:
        if (
            database.startsWith('sqlite:') ||
            database.endsWith('.sqlite') ||
            database.endsWith('.db')
        ) {
            return 'sqlite';
        }
    }

    // Default: TingoDB (comportamiento original)
    return 'tingodb';
}

/**
 * Inicializa y devuelve la colección/tabla para la BD configurada.
 *
 * @param {string} collection  Nombre de la colección / tabla
 * @param {string} database    Identificador de la BD:
 *                               - Nombre de carpeta para TingoDB  (ej. 'api')
 *                               - Ruta de archivo para SQLite      (ej. '/data/app.sqlite')
 *                               - Connection string para MongoDB   (ej. 'mongodb://...')
 * @returns {Promise<Object>}  Wrapper de colección con API unificada
 */
async function initializeDb(collection = 'auth', database = 'api') {
    const type = _detectDbType(database);

    switch (type) {
        case 'mongoose':
            return getMongooseCollection(collection, database);

        case 'sqlite':
            return getSQLiteCollection(collection, database);

        case 'tingodb':
        default:
            return getTingoCollection(collection, database);
    }
}

module.exports = {initializeDb};
