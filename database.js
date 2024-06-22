const tingodb = require('tingodb')().Db;
const path = require('path');
const fs = require('fs');



async function initializeDb(collection = 'auth', database = 'api') {
    let dbPath = path.join(__dirname, 'local', database);
    if (!fs.existsSync(path)) {
        await fs.mkdirSync(dbPath, { recursive: true });
    }
    const db = new tingodb(dbPath, {});
    return db.collection(collection);
}

module.exports = {
    initializeDb
};
