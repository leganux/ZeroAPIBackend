const {initializeDb} = require('./../database');
const {v4: uuidv4} = require('uuid');
const {ObjectID} = require('tingodb')();

/** This function helps  to create and return seelct fields in mongoose */
let selectConstructor = function (select) {
    /** Fragmento que busca y construye el objeto de retorno  select*/
    if (select) {
        let ob = {}
        if (typeof select == 'string') {
            select = select.split(',')
            select.map(function (item, i) {
                ob[item] = 1
            });
        } else if (typeof select == 'object') {
            for (const [key, val] of Object.entries(select)) {
                ob[key] = 1;
            }
        }

        return ob
    }
    return {}

}
let whereConstructor = function (where) {

    if (where) {
        for (const [key, val] of Object.entries(where)) {
            if (Number(val)) {
                where[key] = Number(val)
                continue
            }
            if (typeof val == 'boolean' || val == 'true' || val == 'false') {
                where[key] = Boolean(val)
                continue
            }
        }
    }

    return where
}
let populateConstructor = async function (populate, populateFields, list_of_elements) {
    if (populate.localFields && populate.tables && populate.foreignFields) {
        let inner = []
        let tables = populate.tables.split(',')
        let foreignFields = populate.foreignFields.split(',')
        let localFields = populate.localFields.split(',')
        if (localFields.length == tables.length && foreignFields.length == tables.length) {
            for (let item of list_of_elements) {
                for (let j = 0; j < foreignFields.length; j++) {
                    let foreignField = foreignFields[j]
                    let localField = localFields[j]
                    let table_ = tables[j]
                    let filter = {}
                    if (item[localField]) {
                        let pass = false
                        if (typeof item[localField] == 'string') {
                            filter[foreignField] = (item[localField])
                            pass = 1
                        } else if (Array.isArray(item[localField])) {
                            let mapa = item[localField].map(xtem => {
                                return (xtem)
                            })
                            filter[foreignField] = {$in: mapa}
                            pass = 2
                        }
                        let selectFields = {}
                        if (populateFields && populateFields[table_]) {
                            for (let ytem of populateFields[table_].split(',')) {
                                selectFields[ytem] = 1
                            }
                        }
                        if (pass) {
                            const collection_ = await initializeDb(table_);
                            const list_of_elements_inner = await new Promise((resolve, reject) => {
                                collection_.find(filter, selectFields).toArray((err, docs) => {
                                    if (err) return reject(err);
                                    resolve(docs);
                                });
                            });
                            if (pass == 1) {
                                item[localField] = list_of_elements_inner[0]
                            }
                            if (pass == 2) {
                                item[localField] = list_of_elements_inner
                            }
                            inner.push(item)
                        }

                    }
                }
            }
        }
        return inner
    }
    return list_of_elements


}
let finder = async function (table, options) {
    let {where, whereObject, like, select, paginate, sort, populate, populateFields} = options;

    where = whereConstructor(where)
    like = whereConstructor(like)

    const collection = await initializeDb(table);

    let find = {};

    if (like) {
        for (const [key, val] of Object.entries(like)) {
            find[key] = {$regex: String(val).trim(), $options: 'i'};
        }
    }
    if (where) {
        for (const [key, val] of Object.entries(where)) {
            find[key] = val;
        }
    }
    if (whereObject) {
        for (const [key, val] of Object.entries(whereObject)) {
            find[key] = (val);
        }
    }

    let projection = selectConstructor(select)


    let query = collection.find(find, projection);

    if (paginate && paginate.limit && paginate.page) {
        paginate.limit = Number(paginate.limit);
        paginate.page = Number(paginate.page);
        query.limit(paginate.limit).skip(paginate.page * paginate.limit);
    }
    if (sort) {
        let order = {};
        for (const [key, val] of Object.entries(sort)) {
            order[key] = val;
        }
        query.sort(order);
    }

    let list_of_elements = await new Promise((resolve, reject) => {
        query.toArray((err, docs) => {
            if (err) return reject(err);
            resolve(docs);
        });
    });

    if (populate) {
        list_of_elements = await populateConstructor(populate, populateFields, list_of_elements)
    }

    return list_of_elements
}

async function createOneAPI(req, res) {
    try {
        const {table} = req.params
        const owner = req?.auth?._id || 'public'
        const collection = await initializeDb(table);

        let {select, populate, populateFields} = req.query;

        const newItem = {...req.body, _id: uuidv4(), createdAt: new Date(), updatedAt: new Date(), owner};
        await new Promise((resolve, reject) => {
            collection.insert(newItem, (err, result) => {
                if (err) return reject(err);
                resolve(result);
            });
        });

        let options = {
            where: {_id: newItem._id},
            select, populate, populateFields
        }
        let response = await finder(table, options)
        res.status(200).json({
            collection: table,
            status: 200,
            message: 'Created Success',
            data: response
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            error: err,
            status: 500,
            message: 'Internal server error'
        });
    }
}

async function createManyAPI(req, res) {
    try {
        const {table} = req.params
        const owner = req?.auth?._id || 'public'
        const collection = await initializeDb(table);
        let {select, sort, populate, populateFields} = req.query;


        let date = new Date()
        let body = req.body.map(item => {
            return {...item, _id: uuidv4(), createdAt: date, updatedAt: date, owner}
        })

        await new Promise((resolve, reject) => {
            collection.insert(body, (err, result) => {
                if (err) return reject(err);
                resolve(result);
            });
        });


        let ids = body.map(item => {
            return (item._id)
        })

        let response = await finder(table, {
            where: {_id: {$in: ids}},
            select, sort, populate, populateFields
        })

        res.status(200).json({
            status: 200,
            message: 'Created Many Success',
            data: response
        });
    } catch (err) {
        res.status(500).json({
            error: err,
            status: 500,
            message: 'Internal server error'
        });
    }
}

async function getManyAPI(req, res) {
    try {
        const {table} = req.params
        let {where, whereObject, like, select, paginate, sort, populate, populateFields} = req.query;

        let list_of_elements = await finder(table, {
            where,
            whereObject,
            like,
            select,
            paginate,
            sort,
            populate,
            populateFields
        })

        res.status(200).json({
            status: 200,
            collection: table,
            message: 'Get Many Success',
            data: list_of_elements
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            error: err,
            status: 500,
            message: 'Internal server error'
        });
    }
}

async function getOneByIdAPI(req, res) {
    try {
        const {table, id} = req.params
        let {select, populate, populateFields} = req.query;

        let list_of_elements = await finder(table, {where: {_id: id}, select, populate, populateFields})

        if (list_of_elements.length < 1) {
            res.status(404).json({
                collection: table,
                status: 404,
                message: 'Not found',
                data: {}
            });
            return
        }

        res.status(200).json({
            status: 200,
            collection: table,
            message: 'Get Item Success',
            data: list_of_elements[0]
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            error: err,
            status: 500,
            message: 'Internal server error'
        });
    }

}

async function getOneWhereAPI(req, res) {
    try {
        const {table} = req.params
        let {where, whereObject, like, select, sort, populate, populateFields} = req.query;

        let list_of_elements = await finder(table, {where, whereObject, like, select, sort, populate, populateFields})

        res.status(200).json({
            status: 200,
            collection: table,
            message: 'Get Many Success',
            data: list_of_elements[0]
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            error: err,
            status: 500,
            message: 'Internal server error'
        });
    }

}

async function updateOneByIDAPI(req, res) {
    try {
        const {table, id} = req.params
        let {select, populate, populateFields} = req.query;

        const collection = await initializeDb(table);
        const update = {...req.body, updatedAt: new Date()};

        const numReplaced = await new Promise((resolve, reject) => {
            collection.update({_id: id}, {$set: update}, {}, (err, numReplaced) => {
                if (err) return reject(err);
                resolve(numReplaced);
            });
        });

        if (numReplaced < 1) {
            res.status(404).json({
                collection: table,
                status: 404,
                message: 'Not found',
                data: {}
            });
            return
        }
        let options = {
            where: {_id: id},
            select, populate, populateFields
        }
        let response = await finder(table, options)

        res.status(200).json({
            collection: table,
            status: 200,
            message: 'Updated Success',
            data: response[0]
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({
            error: err,
            status: 500,
            message: 'Internal server error'
        });
    }
}

async function updateWhereAPI(req, res) {
    try {
        const {table} = req.params
        let {where, select, populate, populateFields} = req.query;

        const collection = await initializeDb(table);
        const update = {...req.body, updatedAt: new Date()};

        let findTochange = await finder(table, {
            where
        })

        let ids = findTochange.map(item => {
            return item._id
        })
        where = whereConstructor(where)

        for (let item of ids) {
            await new Promise((resolve, reject) => {
                collection.update({_id: item}, {$set: update}, {many: true}, (err, numReplaced) => {
                    if (err) return reject(err);
                    resolve(numReplaced);
                });
            });
        }
        let response = await finder(table, {
            where: {_id: {$in: ids}}, select, populate, populateFields
        })
        res.status(200).json({
            collection: table,
            status: 200,
            message: 'Updated Success',
            data: response
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            error: err,
            status: 500,
            message: 'Internal server error'
        });
    }
}

async function updateOrCreateWhereAPI(req, res) {
    try {
        const {table} = req.params
        const owner = req?.auth?._id || 'public'
        let {where, select, populate, populateFields} = req.query;

        const collection = await initializeDb(table);
        const update = {...req.body, updatedAt: new Date()};

        let findTochange = await finder(table, {
            where
        })

        let id = ''
        if (findTochange.length > 0) {

            id = findTochange[0]._id
            await new Promise((resolve, reject) => {
                collection.update({_id: id}, {$set: update}, {many: true}, (err, numReplaced) => {
                    if (err) return reject(err);
                    resolve(numReplaced);
                });
            });

        } else {

            const newItem = {...update, ...where, _id: uuidv4(), createdAt: new Date(), updatedAt: new Date(), owner};
            await new Promise((resolve, reject) => {
                collection.insert(newItem, (err, result) => {
                    if (err) return reject(err);
                    resolve(result);
                });
            });
            id = newItem._id
        }

        let response = await finder(table, {
            where: {_id: id}, select, populate, populateFields
        })

        res.status(200).json({
            collection: table,
            status: 200,
            message: 'Uupdated or Created Success',
            data: response
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            error: err,
            status: 500,
            message: 'Internal server error'
        });
    }
}

async function deleteOneByIdAPI(req, res) {
    try {
        const {table, id} = req.params

        const collection = await initializeDb(table);

        const numRemoved = await new Promise((resolve, reject) => {
            collection.remove({_id: id}, {}, (err, numRemoved) => {
                if (err) return reject(err);
                resolve(numRemoved);
            });
        });

        if (numRemoved < 1) {
            res.status(404).json({
                collection: table,
                status: 404,
                message: 'Not found',
                data: {}
            });
            return
        }

        res.status(200).json({
            collection: table,
            status: 200,
            message: 'Deleted Success',
            data: {}
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({
            error: err,
            status: 500,
            message: 'Internal server error'
        });
    }
}

module.exports = {
    createOneAPI,
    createManyAPI,
    getManyAPI,
    getOneByIdAPI, getOneWhereAPI, updateOneByIDAPI, updateWhereAPI, updateOrCreateWhereAPI, deleteOneByIdAPI
};
