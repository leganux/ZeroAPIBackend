const tingodb = require('tingodb')().Db;
const path = require('path');
const fs = require('fs');

/**
 * TingoDB adapter — comportamiento original del proyecto.
 * Devuelve la colección TingoDB tal cual la usaban los controladores.
 */
async function getTingoCollection(collection, database) {
    let dbPath = path.join(__dirname, '..', 'local', database);
    if (!fs.existsSync(dbPath)) {
        fs.mkdirSync(dbPath, {recursive: true});
    }
    const db = new tingodb(dbPath, {});
    return db.collection(collection);
}

module.exports = {getTingoCollection};
