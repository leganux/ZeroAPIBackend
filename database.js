const tingodb = require('tingodb')().Db;
const path = require('path');
const fs = require('fs');

const {MongoClient} = require('mongodb');


async function initializeDb(collection = 'auth', database = 'api', mongodb = false) {
    //todo: work for future both compatibilities
    if (mongodb) {//use mongodb
        const client = new MongoClient(mongodb, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        await client.connect();
        const db = client.db(database);
        return db.collection(collection);
    } else {

        //use tingodb
        let dbPath = path.join(__dirname, 'local', database);
        if (!fs.existsSync(path)) {
            await fs.mkdirSync(dbPath, {recursive: true});
        }
        const db = new tingodb(dbPath, {});
        return db.collection(collection);
    }

}

module.exports = {
    initializeDb
};
