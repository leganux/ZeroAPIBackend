const {initializeDb} = require("../database");
module.exports = async function (table, database) {
    let item = table

    let collection = await initializeDb(item, database);

    let list_of_elements = await new Promise((resolve, reject) => {

        collection.find({}).sort({createdAt: -1}).limit(5).toArray((err, docs) => {
            if (err) return reject(err);
            resolve(docs);
        });

    });

    let fields = {}
    for (let jtem of list_of_elements) {
        for (let [key, val] of Object.entries(jtem)) {
            let type = typeof val
            if (type == 'object') {
                continue
            }
            if (key == 'owner' || key == 'password') {
                continue
            }
            fields[key] = type
        }
    }

    return fields

}