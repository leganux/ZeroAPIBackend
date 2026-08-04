/**
 * SQLite adapter usando Sequelize.
 *
 * Estrategia "document-store":
 *   Cada tabla en SQLite tiene sólo dos columnas:
 *     _id   TEXT  PRIMARY KEY
 *     _doc  TEXT  (JSON stringificado del documento completo)
 *
 *   Esto permite manejar colecciones completamente dinámicas y sin
 *   esquema previo, igual que TingoDB/MongoDB.
 *
 * Filtrado/ordenamiento se hace en JS después de leer los docs.
 *
 * Uso:  pasar como `database` un path de archivo:
 *   - '/ruta/a/mi_base.sqlite'
 *   - '/ruta/a/mi_base.db'
 *   - 'sqlite:/ruta/a/mi_base.sqlite'   (se elimina el prefijo sqlite:)
 */

const {Sequelize, DataTypes} = require('sequelize');
const path = require('path');
const fs = require('fs');

// Cache de instancias Sequelize por ruta de archivo
const _sequelizeInstances = {};
// Cache de modelos por "dbPath:tableName"
const _modelCache = {};

/** Normaliza el path quitando el prefijo "sqlite:" si existe */
function normalizePath(dbPath) {
    if (typeof dbPath === 'string' && dbPath.startsWith('sqlite:')) {
        return dbPath.slice('sqlite:'.length);
    }
    return dbPath;
}

/** Obtiene (o crea) la instancia Sequelize para un archivo SQLite */
function _getSequelizeInstance(dbPath) {
    const key = dbPath;
    if (!_sequelizeInstances[key]) {
        // Garantiza que el directorio exista
        const dir = path.dirname(path.resolve(dbPath));
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, {recursive: true});
        }
        _sequelizeInstances[key] = new Sequelize({
            dialect: 'sqlite',
            storage: dbPath,
            logging: false
        });
    }
    return _sequelizeInstances[key];
}

/** Obtiene (o crea y sincroniza) el modelo para una tabla dada */
async function _getModel(tableName, dbPath) {
    const cacheKey = dbPath + '::' + tableName;
    if (!_modelCache[cacheKey]) {
        const sequelize = _getSequelizeInstance(dbPath);
        const Model = sequelize.define(
            tableName,
            {
                _id: {type: DataTypes.TEXT, primaryKey: true, allowNull: false},
                _doc: {type: DataTypes.TEXT, allowNull: false}
            },
            {
                tableName: tableName,
                timestamps: false,
                freezeTableName: true
            }
        );
        await Model.sync({force: false}); // Crea la tabla si no existe
        _modelCache[cacheKey] = Model;
    }
    return _modelCache[cacheKey];
}

// ---------------------------------------------------------------------------
// Helpers de filtrado en memoria (traducen la sintaxis MongoDB a JS)
// ---------------------------------------------------------------------------

/** Comprueba si un documento JS satisface un filtro estilo MongoDB */
function _matchesFilter(doc, filter) {
    if (!filter || Object.keys(filter).length === 0) return true;

    for (const [key, condition] of Object.entries(filter)) {
        const docVal = doc[key];

        // Null / undefined match
        if (condition === null || condition === undefined) {
            if (docVal !== null && docVal !== undefined) return false;
            continue;
        }

        if (typeof condition === 'object' && !Array.isArray(condition)) {
            // Operadores MongoDB
            if ('$in' in condition) {
                if (!condition.$in.map(String).includes(String(docVal))) return false;
            } else if ('$nin' in condition) {
                if (condition.$nin.map(String).includes(String(docVal))) return false;
            } else if ('$regex' in condition) {
                const flags = condition.$options || 'i';
                const regex = new RegExp(condition.$regex, flags);
                if (!regex.test(String(docVal || ''))) return false;
            } else if ('$gt' in condition) {
                if (!(docVal > condition.$gt)) return false;
            } else if ('$gte' in condition) {
                if (!(docVal >= condition.$gte)) return false;
            } else if ('$lt' in condition) {
                if (!(docVal < condition.$lt)) return false;
            } else if ('$lte' in condition) {
                if (!(docVal <= condition.$lte)) return false;
            } else if ('$ne' in condition) {
                if (String(docVal) === String(condition.$ne)) return false;
            } else {
                // Match de objeto anidado
                if (JSON.stringify(docVal) !== JSON.stringify(condition)) return false;
            }
        } else {
            // Igualdad directa (con coerción de tipo ligera)
            if (String(docVal) !== String(condition)) return false;
        }
    }
    return true;
}

/** Aplica una proyección (inclusión o exclusión de campos) a un documento */
function _applyProjection(doc, projection) {
    if (!projection || Object.keys(projection).length === 0) return doc;

    const includeKeys = Object.keys(projection).filter(k => projection[k] === 1);
    const excludeKeys = Object.keys(projection).filter(k => projection[k] === 0);

    if (includeKeys.length > 0) {
        const result = {_id: doc._id};
        includeKeys.forEach(k => {
            if (doc[k] !== undefined) result[k] = doc[k];
        });
        return result;
    } else {
        const result = {...doc};
        excludeKeys.forEach(k => delete result[k]);
        return result;
    }
}

// ---------------------------------------------------------------------------
// Wrapper que expone exactamente la misma API callback que TingoDB/MongoDB
// ---------------------------------------------------------------------------

function _createSQLiteWrapper(Model) {
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
                async toArray(callback) {
                    try {
                        const rows = await Model.findAll({raw: true});
                        let docs = rows.map(row => {
                            try {
                                return JSON.parse(row._doc);
                            } catch (e) {
                                return {_id: row._id};
                            }
                        });

                        // Filtrado
                        docs = docs.filter(doc => _matchesFilter(doc, _filter));

                        // Ordenamiento
                        if (_sort && Object.keys(_sort).length > 0) {
                            const entries = Object.entries(_sort);
                            docs.sort((a, b) => {
                                for (const [key, order] of entries) {
                                    const av = a[key];
                                    const bv = b[key];
                                    if (av < bv) return order === 1 ? -1 : 1;
                                    if (av > bv) return order === 1 ? 1 : -1;
                                }
                                return 0;
                            });
                        }

                        // Skip
                        if (_skip) docs = docs.slice(_skip);

                        // Limit
                        if (_limit) docs = docs.slice(0, _limit);

                        // Proyección
                        if (Object.keys(_projection).length > 0) {
                            docs = docs.map(doc => _applyProjection(doc, _projection));
                        }

                        callback(null, docs);
                    } catch (err) {
                        callback(err);
                    }
                }
            };
            return builder;
        },

        /** insert(doc | doc[], callback) */
        async insert(docs_or_doc, callback) {
            try {
                const items = Array.isArray(docs_or_doc) ? docs_or_doc : [docs_or_doc];
                for (const item of items) {
                    await Model.create({_id: item._id, _doc: JSON.stringify(item)});
                }
                callback(null, docs_or_doc);
            } catch (err) {
                callback(err);
            }
        },

        /** update(filter, {$set: ...}, options, callback) */
        async update(filter, updateOp, options, callback) {
            try {
                const rows = await Model.findAll({raw: true});
                let matched = rows
                    .map(row => ({raw: row, parsed: JSON.parse(row._doc)}))
                    .filter(d => _matchesFilter(d.parsed, filter));

                let count = 0;
                for (const d of matched) {
                    let updated = {...d.parsed};

                    if (updateOp.$set) {
                        // Eliminar campos cuyo valor sea undefined (equivale a $unset)
                        for (const [k, v] of Object.entries(updateOp.$set)) {
                            if (v === undefined || v === null) {
                                delete updated[k];
                            } else {
                                updated[k] = v;
                            }
                        }
                    }
                    if (updateOp.$unset) {
                        for (const k of Object.keys(updateOp.$unset)) {
                            delete updated[k];
                        }
                    }

                    await Model.update(
                        {_doc: JSON.stringify(updated)},
                        {where: {_id: d.raw._id}}
                    );
                    count++;
                }

                callback(null, count);
            } catch (err) {
                callback(err);
            }
        },

        /** remove(filter, options, callback) */
        async remove(filter, options, callback) {
            try {
                const rows = await Model.findAll({raw: true});
                let matched = rows
                    .map(row => ({raw: row, parsed: JSON.parse(row._doc)}))
                    .filter(d => _matchesFilter(d.parsed, filter));

                let count = 0;
                for (const d of matched) {
                    await Model.destroy({where: {_id: d.raw._id}});
                    count++;
                }

                callback(null, count);
            } catch (err) {
                callback(err);
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
 * @param {string} collection  Nombre de la tabla/colección
 * @param {string} dbPath      Ruta al archivo SQLite
 *                             Ej: '/data/mi_app.sqlite', 'sqlite:/data/mi_app.db'
 */
async function getSQLiteCollection(collection, dbPath) {
    const normalizedPath = normalizePath(dbPath);
    const Model = await _getModel(collection, normalizedPath);
    return _createSQLiteWrapper(Model);
}

module.exports = {getSQLiteCollection};
