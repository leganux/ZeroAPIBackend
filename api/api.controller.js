const {initializeDb} = require('./../database');
const {v4: uuidv4} = require('uuid');
const {getStatistics, getStatisticsString} = require("../functions/statistics");
const describe = require("../functions/describe");
const path = require("path");
const fsextra = require("fs-extra");

const XLSX = require('xlsx');
const fs = require('fs');
const moment = require("moment");


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
    let {where, whereObject, like, select, paginate, sort, populate, populateFields, database} = options;

    where = whereConstructor(where)
    like = whereConstructor(like)

    const collection = await initializeDb(table, database);

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

let createOneAPI = function (database) {
    return async function (req, res) {
        try {
            const {table} = req.params
            const owner = req?.auth?._id || 'public'
            const collection = await initializeDb(table, database);

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
                select, populate, populateFields, database
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
}

let createManyAPI = function (database) {
    return async function (req, res) {
        try {
            const {table} = req.params
            const owner = req?.auth?._id || 'public'
            const collection = await initializeDb(table, database);
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
                select, sort, populate, populateFields, database
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
}

let getManyAPI = function (database) {
    return async function (req, res) {
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
                populateFields, database
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
}


let getOneByIdAPI = function (database) {
    return async function (req, res) {
        try {
            const {table, id} = req.params
            let {select, populate, populateFields} = req.query;

            let list_of_elements = await finder(table, {where: {_id: id}, select, populate, populateFields, database})

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
}


let getOneWhereAPI = function (database) {
    return async function (req, res) {
        try {
            const {table} = req.params
            let {where, whereObject, like, select, sort, populate, populateFields} = req.query;

            let list_of_elements = await finder(table, {
                where,
                whereObject,
                like,
                select,
                sort,
                populate,
                populateFields,
                database
            })

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
}


let updateOneByIDAPI = function (database) {
    return async function (req, res) {
        try {
            const {table, id} = req.params
            let {select, populate, populateFields} = req.query;

            const collection = await initializeDb(table, database);
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
                select, populate, populateFields, database
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
}


let updateWhereAPI = function (database) {
    return async function (req, res) {
        try {
            const {table} = req.params
            let {where, select, populate, populateFields} = req.query;

            const collection = await initializeDb(table, database);
            const update = {...req.body, updatedAt: new Date()};

            let findTochange = await finder(table, {
                where, database
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
                where: {_id: {$in: ids}}, select, populate, populateFields, database
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
}

let updateOrCreateWhereAPI = function (database) {
    return async function (req, res) {
        try {
            const {table} = req.params
            const owner = req?.auth?._id || 'public'
            let {where, select, populate, populateFields} = req.query;

            const collection = await initializeDb(table, database);
            const update = {...req.body, updatedAt: new Date()};

            let findTochange = await finder(table, {
                where, database
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

                const newItem = {
                    ...update, ...where,
                    _id: uuidv4(),
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    owner
                };
                await new Promise((resolve, reject) => {
                    collection.insert(newItem, (err, result) => {
                        if (err) return reject(err);
                        resolve(result);
                    });
                });
                id = newItem._id
            }

            let response = await finder(table, {
                where: {_id: id}, select, populate, populateFields, database
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
}


let deleteOneByIdAPI = function (database) {
    return async function (req, res) {
        try {
            const {table, id} = req.params

            const collection = await initializeDb(table, database);

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
}

let StatisticsAPI = function (database) {
    return async function (req, res) {
        try {
            const {table} = req.params;
            let {where, like, select, paginate, sort, populate, populateFields, top} = req.query;

            let description = await describe(table, database);


            let list_of_elements = await finder(table, {
                where,
                like,
                select,
                paginate,
                sort,
                populate,
                populateFields,
                database
            });

            let selectioned = selectConstructor(select);

            if (Object.keys(selectioned).length < 1) {
                return res.status(400).json({
                    error: 'Select at most one field using query select to execute',
                    status: 400,
                    message: 'Bad request'
                });
            }

            let arrayOfElements = Object.keys(selectioned).reduce((acc, key) => {
                acc[key] = list_of_elements
                    .filter(item => item[key] && typeof item[key] == description[key])
                    .map(item => item[key]);
                return acc;
            }, {});
            console.table(list_of_elements)


            let arrResponse = Object.entries(arrayOfElements).reduce((acc, [key, val]) => {
                if (description[key] === 'number') {
                    acc[key] = {type: description[key], statistics: getStatistics(val)};
                } else if (description[key] === 'string') {
                    acc[key] = {type: description[key], statistics: getStatisticsString(val, top)};
                }
                return acc;
            }, {});

            res.status(200).json({
                status: 200,
                collection: table,
                message: 'Get Many Success',
                data: arrResponse
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
}

let split = function (database) {
    return async function (req, res) {
        try {
            const {table} = req.params;
            const owner = req?.auth?._id || 'public'
            let {catalogs, skip} = req.body;
            if (catalogs && typeof catalogs == 'string') {
                catalogs = catalogs.split(',')
            }
            if (skip && typeof skip == 'string') {
                skip = skip.split(',')
            }
            if (!catalogs) {
                catalogs = []
            }
            if (!skip) {
                skip = []
            }


            let list_of_elements = await finder(table, {
                database
            });
            let total = list_of_elements.length
            let count = 0

            for (let item of list_of_elements) {
                let percent = (count * 100) / total
                count++
                console.log('************ Completed: ' + percent + '% ******************')
                console.log('************ Porccess: ' + count + '/' + total + ' ******************')
                for (let [key, val] of Object.entries(item)) {
                    if (skip.includes(key) || key == 'createdAt' || key == 'updatedAt') {
                        console.log('** Skip ' + key)
                        continue
                    }
                    let newTable = ''
                    let wasArray = false

                    if (typeof val == 'object') {
                        newTable = key
                        if (Array.isArray(val)) {
                            wasArray = true
                            let newTableRelation = 'relation_' + table + '_' + key
                            for (let jtem of val) {
                                let found = await finder(newTable, {where: jtem, database})
                                let id_relation = false
                                if (found && found.length > 0) {
                                    id_relation = found[0]._id
                                } else {
                                    const newItem = {
                                        ...jtem,
                                        _id: uuidv4(),
                                        createdAt: new Date(),
                                        updatedAt: new Date(),
                                        owner
                                    };
                                    const collection = await initializeDb(newTable, database);
                                    await new Promise((resolve, reject) => {
                                        collection.insert(newItem, (err, result) => {
                                            if (err) return reject(err);
                                            resolve(result);
                                        });
                                    });
                                    id_relation = newItem._id

                                }
                                let newItem_inner = {
                                    _id: uuidv4(),
                                    createdAt: new Date(),
                                    updatedAt: new Date(),
                                    owner
                                };
                                newItem_inner[table] = item._id
                                newItem_inner[newTable] = id_relation

                                console.log('** Insert Relation' + newTableRelation, newItem_inner)
                                let innercollection = await initializeDb(newTableRelation, database);
                                await new Promise((resolve, reject) => {
                                    innercollection.insert(newItem_inner, (err, result) => {
                                        if (err) return reject(err);
                                        resolve(result);
                                    });
                                });

                            }

                        } else {
                            let id__ = false
                            newTable = table + '_' + key
                            let found = await finder(newTable, {where: val, database})
                            if (found && found.length > 0) {
                                id__ = found[0]._id
                            } else {
                                const newItem = {
                                    ...val,
                                    _id: uuidv4(),
                                    createdAt: new Date(),
                                    updatedAt: new Date(),
                                    owner
                                };

                                const collection = await initializeDb(newTable, database);
                                await new Promise((resolve, reject) => {
                                    collection.insert(newItem, (err, result) => {
                                        if (err) return reject(err);
                                        resolve(result);
                                    });
                                });

                                id__ = newItem._id
                                console.log('** Insert  object ' + newTable, newItem)
                            }

                            const collection_ = await initializeDb(table, database);
                            const update = {updatedAt: new Date()};
                            update[key] = id__

                            await new Promise((resolve, reject) => {
                                collection_.update({_id: item._id}, {$set: update}, {}, (err, numReplaced) => {
                                    if (err) return reject(err);
                                    resolve(numReplaced);
                                });
                            });


                        }
                    } else if (catalogs.includes(key)) {


                        let id__ = false
                        newTable = table + '_' + key
                        let where = {}
                        where[key] = val
                        let found = await finder(newTable, {where: where, database})
                        if (found && found.length > 0) {
                            id__ = found[0]._id
                        } else {
                            const newItem = {
                                ...where,
                                _id: uuidv4(),
                                createdAt: new Date(),
                                updatedAt: new Date(),
                                owner
                            };
                            const collection = await initializeDb(newTable, database);
                            await new Promise((resolve, reject) => {
                                collection.insert(newItem, (err, result) => {
                                    if (err) return reject(err);
                                    resolve(result);
                                });
                            });

                            id__ = newItem._id
                            console.log('** Insert catalogue ' + newTable, newItem)
                        }

                        const collection_ = await initializeDb(table, database);
                        const update = {updatedAt: new Date()};
                        update[key] = id__

                        await new Promise((resolve, reject) => {
                            collection_.update({_id: item._id}, {$set: update}, {}, (err, numReplaced) => {
                                if (err) return reject(err);
                                resolve(numReplaced);
                            });
                        });


                    }

                    if (wasArray) {
                        const collection = await initializeDb(table, database);
                        const update = {updatedAt: new Date()};
                        update[key] = undefined

                        await new Promise((resolve, reject) => {
                            collection.update({_id: item._id}, {$set: update}, {}, (err, numReplaced) => {
                                if (err) return reject(err);
                                resolve(numReplaced);
                            });
                        });
                    }

                }
            }

            let list_of_elements_new = await finder(table, {
                database
            });

            res.status(200).json({
                status: 200,
                collection: table,
                message: 'Split Success',
                data: list_of_elements_new
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
}

let drop = function (database) {
    return async function (req, res) {
        try {
            const {table} = req.params


            let dest = path.join(__dirname, '..', 'local', database, table)
            await fsextra.remove(dest);
            console.log('Table dropped  correctly ')


            res.status(200).json({
                collection: table,
                status: 200,
                message: 'Table dropped  correctly',
                data: dest
            });

        } catch (e) {
            console.error(e);
            res.status(500).json({
                error: e,
                status: 500,
                message: 'Internal server error'
            });
        }
    }
}

let xlsx = function (database) {
    return async function (req, res) {
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
                populateFields, database
            })


            const workbook = XLSX.utils.book_new();
            const worksheet = XLSX.utils.json_to_sheet(list_of_elements);

            XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
            const excelBuffer = XLSX.write(workbook, {bookType: 'xlsx', type: 'buffer'});

            let name = moment().format('YYYYMMDDHHmmss') + '_' + database + '_' + table + '.xlsx'
            res.status(200)
                .set({
                    'Content-Disposition': 'attachment; filename="' + name + '"',
                    'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                })
                .send(excelBuffer);

        } catch (err) {
            console.error(err);
            res.status(500).json({
                error: err,
                status: 500,
                message: 'Internal server error'
            });
        }
    }
}
let json = function (database) {
    return async function (req, res) {
        try {
            if (!req.file) {
                return res.status(400).send('File not uploaded.');
            }
            const {table} = req.params
            const {avoidDuplicates} = req.query
            const owner = req?.auth?._id || 'public'
            const collection = await initializeDb(table, database);

            let jsonData = JSON.parse(req.file.buffer.toString());
            if (!Array.isArray(jsonData)) {
                jsonData = [jsonData]
            }


            if (avoidDuplicates && avoidDuplicates.id && avoidDuplicates.push) {
                let obj = {};
                jsonData.forEach(item => {
                    const itemId = item[avoidDuplicates.id];
                    if (!obj[itemId]) {
                        obj[itemId] = {...item};
                        if (Array.isArray(avoidDuplicates.push)) {
                            avoidDuplicates.push.forEach(field => {
                                obj[itemId][field] = [...item[field]]; // Inicializa como un array con el primer valor
                            });
                        } else if (typeof avoidDuplicates.push === 'string') {
                            const fieldsToPush = avoidDuplicates.push.split(',');
                            fieldsToPush.forEach(field => {
                                obj[itemId][field] = [...item[field]]; // Inicializa como un array con el primer valor
                            });
                        }
                    } else {
                        // Si ya existe el objeto, concatena los arrays correspondientes
                        if (Array.isArray(avoidDuplicates.push)) {
                            avoidDuplicates.push.forEach(field => {
                                if (item[field]) {
                                    obj[itemId][field].push(...item[field]);
                                }
                            });
                        } else if (typeof avoidDuplicates.push === 'string') {
                            const fieldsToPush = avoidDuplicates.push.split(',');
                            fieldsToPush.forEach(field => {
                                if (item[field]) {
                                    obj[itemId][field].push(...item[field]);
                                }
                            });
                        }
                    }
                });

                // Convertir el objeto de nuevo a un array
                jsonData = Object.values(obj);
            }

            let date = new Date()
            let body = jsonData.map(item => {
                return {...item, _id: uuidv4(), createdAt: date, updatedAt: date, owner}
            })


            await new Promise((resolve, reject) => {
                collection.insert(body, (err, result) => {
                    if (err) return reject(err);
                    resolve(result);
                });
            });

            res.status(200).json({
                status: 200,
                message: 'Created Many Success',
                data: {},
                length: jsonData.length
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
}
let xlsx_upload = function (database) {
    return async function (req, res) {
        try {
            const {table} = req.params
            if (!req.file) {
                return res.status(400).send('File not uploaded.');
            }

            const owner = req?.auth?._id || 'public'
            const workbook = XLSX.read(req.file.buffer, {type: 'buffer'});


            let tables = []

            for (let sheetName of workbook.SheetNames) {
                const worksheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet);


                const collection = await initializeDb('xls_' + table + '_' + sheetName, database);
                tables.push('xls_' + table + '_' + sheetName)
                let date = new Date()
                let body = jsonData.map(item => {
                    return {...item, _id: uuidv4(), createdAt: date, updatedAt: date, owner}
                })

                await new Promise((resolve, reject) => {
                    collection.insert(body, (err, result) => {
                        if (err) return reject(err);
                        resolve(result);
                    });
                });

            }

            res.status(200).json({
                collection: table,
                status: 200,
                message: 'Excel Imported correctly',
                data: {tables}
            });

        } catch (e) {
            console.error(e);
            res.status(500).json({
                error: e,
                status: 500,
                message: 'Internal server error'
            });
        }
    }
}

let transform = function (database) {
    return async function (req, res) {
        try {
            const {table, to} = req.params
            let {where, whereObject, like, select, paginate, sort, populate, populateFields} = req.query;

            let list_of_elements = await finder(table, {
                where,
                whereObject,
                like,
                select,
                paginate,
                sort,
                populate,
                populateFields, database
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
}

module.exports = {
    json,
    transform,
    xlsx,
    drop,
    split,
    createOneAPI,
    createManyAPI,
    getManyAPI,
    StatisticsAPI,
    getOneByIdAPI,
    getOneWhereAPI,
    updateOneByIDAPI,
    updateWhereAPI,
    updateOrCreateWhereAPI,
    deleteOneByIdAPI, xlsx_upload
};

/*
*   TODO: Transformaciones
*
*   logaritmica log 10 y numero
*   etiquetas a numeros
*   remplazo
*   redondeo
*   ceil
*   floor
*   relleno [ median, mean, mode  ]
*   tipificacion (x - media ) / desvicion estandar
    Correlacion
*
*  logaritmic,number_tag,replace(object),ceil,floor,fill(object),
*
*
*
* */
