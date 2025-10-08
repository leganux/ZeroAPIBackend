const Tingodb = require('tingodb')().Db;
const MongoClient = require('mongodb').MongoClient;
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

async function connectTingoDB(database) {
    return new Promise((resolve, reject) => {
        if (!database) {
            reject(new Error("Database name is required for TingoDB"));
            return;
        }
        const dbPath = path.join(__dirname, 'local', database);
        fs.mkdirSync(dbPath, { recursive: true });
        const db = new Tingodb(dbPath, {});
        resolve({ collection: db.collection(database), flavor: 'tingo' });
    });
}

async function connectMongoDB(uri) {
    try {
        const client = await MongoClient.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
        const db = client.db();
        return { 
            collection: {
                insert: (doc) => db.collection('test_table').insertOne(doc),
                find: (query) => db.collection('test_table').find(query),
                update: (query, update) => db.collection('test_table').updateOne(query, update),
                remove: (query) => db.collection('test_table').deleteOne(query),
                findOne: (query) => db.collection('test_table').findOne(query)
            }, 
            flavor: 'mongodb' 
        };
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
        throw error;
    }
}

async function connectSQLite(dblocation) {
    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(dblocation, (err) => {
            if (err) {
                console.error('Error connecting to SQLite database:', err);
                reject(err);
            } else {
                db.run(`CREATE TABLE IF NOT EXISTS test_table (
                    _id TEXT PRIMARY KEY,
                    name TEXT,
                    age INTEGER
                )`, (err) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve({ collection: db, flavor: 'sqlite' });
                    }
                });
            }
        });
    });
}

async function initializeDb(table, config) {
    const { database, dburi, dblocation, flavor } = config;
    
    switch (flavor) {
        case 'mongodb':
            return connectMongoDB(dburi || 'mongodb://localhost/zeroApi');
        case 'sqlite':
            return connectSQLite(dblocation || path.join(os.homedir(), 'zeroApi', 'database.db'));
        case 'tingo':
        default:
            return connectTingoDB(database || 'zeroApi');
    }
}

module.exports = {
    initializeDb,
    connectTingoDB,
    connectMongoDB,
    connectSQLite
};
