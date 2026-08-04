/**
 * Mongoose adapter para MongoDB.
 *
 * Usa un esquema completamente flexible (strict: false) con _id de tipo String
 * para que los UUIDs generados por el proyecto se almacenen sin modificaciones.
 *
 * Expone exactamente la misma API callback que TingoDB/MongoDB nativo para que
 * los controladores existentes funcionen sin ningún cambio.
 *
 * Uso:  pasar como `database` el connection string de MongoDB:
 *   - 'mongodb://localhost:27017/mi_base'
 *   - 'mongodb+srv://usuario:clave@cluster.mongodb.net/mi_base'
 */

const mongoose = require('mongoose');

// Cache de conexiones por connection string  (clave → instancia de Connection)
const _connectionCache = {};
// Cache de modelos  (clave → Model)
const _modelCache = {};

/**
 * Devuelve una conexión Mongoose activa para el connection string dado.
 * Reutiliza la conexión si ya está en estado readyState === 1 (connected).
 */
async function _getConnection(connectionString) {
    const cached = _connectionCache[connectionString];

    // Reutilizar si ya está conectada
    if (cached && cached.readyState === 1) {
        return cached;
    }

    // Crear nueva conexión
    const conn = mongoose.createConnection(connectionString, {
        serverSelectionTimeoutMS: 15000,
        connectTimeoutMS: 15000,
        socketTimeoutMS: 45000
    });

    // Esperar a que conecte o falle
    await new Promise((resolve, reject) => {
        conn.once('connected', resolve);
        conn.once('error', reject);
    });

    _connectionCache[connectionString] = conn;
    return conn;
}

/**
 * Devuelve el Model Mongoose para una colección dada.
 * Reutiliza el modelo si ya fue compilado en la misma conexión.
 */
async function _getModel(collectionName, connectionString) {
    const cacheKey = connectionString + '::' + collectionName;
    if (_modelCache[cacheKey]) {
        return _modelCache[cacheKey];
    }

    const conn = await _getConnection(connectionString);

    // Reutilizar modelo ya registrado en esta conexión
    if (conn.models[collectionName]) {
        _modelCache[cacheKey] = conn.models[collectionName];
        return _modelCache[cacheKey];
    }

    // Esquema totalmente flexible: _id es String (UUID), el resto libre
    const schema = new mongoose.Schema(
        {_id: {type: String, required: true}},
        {
            strict: false,       // permite campos no declarados en el schema
            timestamps: false,   // el controlador ya maneja createdAt/updatedAt
            versionKey: false,   // sin campo __v
            collection: collectionName
        }
    );

    const Model = conn.model(collectionName, schema, collectionName);
    _modelCache[cacheKey] = Model;
    return Model;
}

// ---------------------------------------------------------------------------
// Wrapper que expone exactamente la misma API callback que TingoDB/MongoDB
// ---------------------------------------------------------------------------

function _createMongooseWrapper(Model) {
    return {
        /**
         * find(filter, projection) → QueryBuilder
         * El QueryBuilder expone: .sort(), .limit(), .skip(), .toArray(cb)
         */
        find(filter, projection) {
            let _filter = filter || {};
            let _projection = projection || {};
            let _sort = null;
            let _limit = null;
            let _skip = null;

            const builder = {
                sort(order) {
                    _sort = order;
                    return builder;
                },
                limit(n) {
                    _limit = Number(n);
                    return builder;
                },
                skip(n) {
                    _skip = Number(n);
                    return builder;
                },
                toArray(callback) {
                    try {
                        let q = Model.find(_filter, _projection).lean();
                        if (_sort)  q = q.sort(_sort);
                        if (_limit) q = q.limit(_limit);
                        if (_skip)  q = q.skip(_skip);
                        q.exec()
                            .then(docs => callback(null, docs))
                            .catch(err => callback(err));
                    } catch (e) {
                        callback(e);
                    }
                }
            };
            return builder;
        },

        /** insert(doc | doc[], callback) */
        insert(docs_or_doc, callback) {
            try {
                const items = Array.isArray(docs_or_doc) ? docs_or_doc : [docs_or_doc];
                Model.insertMany(items)
                    .then(() => callback(null, docs_or_doc))
                    .catch(err => callback(err));
            } catch (e) {
                callback(e);
            }
        },

        /**
         * update(filter, {$set: ...}, options, callback)
         * Devuelve en el callback el número de documentos que coincidieron
         * (matchedCount), igual que lo espera el controlador.
         */
        update(filter, updateOp, options, callback) {
            try {
                Model.updateOne(filter, updateOp)
                    .then(result => callback(null, result.matchedCount > 0 ? result.matchedCount : result.modifiedCount))
                    .catch(err => callback(err));
            } catch (e) {
                callback(e);
            }
        },

        /** remove(filter, options, callback) */
        remove(filter, options, callback) {
            try {
                Model.deleteMany(filter)
                    .then(result => callback(null, result.deletedCount))
                    .catch(err => callback(err));
            } catch (e) {
                callback(e);
            }
        }
    };
}

// ---------------------------------------------------------------------------
// Punto de entrada público
// ---------------------------------------------------------------------------

/**
 * Devuelve un wrapper con la misma API callback que TingoDB/MongoDB nativo.
 *
 * @param {string} collection       Nombre de la colección
 * @param {string} connectionString Connection string de MongoDB
 *                                  Ej: 'mongodb://localhost:27017/mi_app'
 */
async function getMongooseCollection(collection, connectionString) {
    const Model = await _getModel(collection, connectionString);
    return _createMongooseWrapper(Model);
}

module.exports = {getMongooseCollection};
