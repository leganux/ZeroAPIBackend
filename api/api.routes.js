const express = require('express');
const {
    createOneAPI,
    createManyAPI,
    getManyAPI,
    getOneByIdAPI,
    getOneWhereAPI,
    updateOneByIDAPI,
    updateWhereAPI,
    updateOrCreateWhereAPI,
    deleteOneByIdAPI,
    StatisticsAPI,
    split,
    drop,
    xlsx,
    xlsx_upload,
    transform,
    json,
    exportToJson,
    importFromJson,
    bigQueryAPI
} = require('./api.controller');

const router = express.Router();

const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({storage: storage});

module.exports = function (middleware = false, database = 'api', flavor = 'tingo') {
    if (middleware) {

        router.post('/:table/xlsx', [upload.single('file'), middleware], xlsx_upload(database, flavor));
        router.post('/:table/json', [upload.single('file'), middleware], importFromJson(database, flavor));
        router.post('/:table/transform/:to', middleware, transform(database, flavor));

        router.post('/:table/many', middleware, createManyAPI(database, flavor));
        router.post('/:table/split', middleware, split(database, flavor));
        router.post('/:table/', middleware, createOneAPI(database, flavor));

        router.get('/:table/statistics', middleware, StatisticsAPI(database, flavor));
        router.get('/:table/xlsx', middleware, xlsx(database, flavor));
        router.get('/:table/json', middleware, exportToJson(database, flavor));

        router.get('/:table/', middleware, getManyAPI(database, flavor));
        router.get('/:table/one', middleware, getOneWhereAPI(database, flavor));
        router.get('/:table/:id', middleware, getOneByIdAPI(database, flavor));

        router.put('/:table/findOrCreate', middleware, updateOrCreateWhereAPI(database, flavor));
        router.put('/:table/:id', middleware, updateOneByIDAPI(database, flavor));
        router.put('/:table/', middleware, updateWhereAPI(database, flavor));

        router.delete('/:table/drop', middleware, drop(database, flavor));
        router.delete('/:table/:id', middleware, deleteOneByIdAPI(database, flavor));
        router.post('/:table/bigquery', middleware, bigQueryAPI(database, flavor));
    } else {
        router.post('/:table/xlsx', upload.single('file'), xlsx_upload(database, flavor));
        router.post('/:table/json', upload.single('file'), importFromJson(database, flavor));
        router.post('/:table/transform/:to', transform(database, flavor));

        router.post('/:table/many', createManyAPI(database, flavor));
        router.post('/:table/split', split(database, flavor));
        router.post('/:table/', createOneAPI(database, flavor));
        router.post('/:table/bigquery', bigQueryAPI(database, flavor));

        router.get('/:table/statistics', StatisticsAPI(database, flavor));
        router.get('/:table/xlsx', xlsx(database, flavor));
        router.get('/:table/json', exportToJson(database, flavor));

        router.get('/:table/', getManyAPI(database, flavor));
        router.get('/:table/one', getOneWhereAPI(database, flavor));
        router.get('/:table/:id', getOneByIdAPI(database, flavor));

        router.put('/:table/findOrCreate', updateOrCreateWhereAPI(database, flavor));
        router.put('/:table/:id', updateOneByIDAPI(database, flavor));
        router.put('/:table/', updateWhereAPI(database, flavor));

        router.delete('/:table/drop', drop(database, flavor));
        router.delete('/:table/:id', deleteOneByIdAPI(database, flavor));
    }
    return router
};
