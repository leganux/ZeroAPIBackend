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
    xlsx, xlsx_upload, transform,json
} = require('./api.controller');

const router = express.Router();

const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({storage: storage});

module.exports = function (middleware = false, database = 'api') {
    if (middleware) {

        router.post('/:table/xlsx', [upload.single('file'), middleware], xlsx_upload(database));
        router.post('/:table/json', [upload.single('file'), middleware], json(database));
        router.post('/:table/transform/:to', middleware, transform(database));

        router.post('/:table/many', middleware, createManyAPI(database));
        router.post('/:table/split', middleware, split(database));
        router.post('/:table/', middleware, createOneAPI(database));

        router.get('/:table/statistics', middleware, StatisticsAPI(database));
        router.get('/:table/xlsx', middleware, xlsx(database));

        router.get('/:table/', middleware, getManyAPI(database));
        router.get('/:table/one', middleware, getOneWhereAPI(database));
        router.get('/:table/:id', middleware, getOneByIdAPI(database));

        router.put('/:table/findOrCreate', middleware, updateOrCreateWhereAPI(database));
        router.put('/:table/:id', middleware, updateOneByIDAPI(database));
        router.put('/:table/', middleware, updateWhereAPI(database));

        router.delete('/:table/drop', middleware, drop(database));
        router.delete('/:table/:id', middleware, deleteOneByIdAPI(database));
    } else {
        router.post('/:table/xlsx', upload.single('file'), xlsx_upload(database));
        router.post('/:table/json', upload.single('file'), json(database));
        router.post('/:table/transform/:to', transform(database));

        router.post('/:table/many', createManyAPI(database));
        router.post('/:table/split', split(database));
        router.post('/:table/', createOneAPI(database));

        router.get('/:table/statistics', StatisticsAPI(database));
        router.get('/:table/xlsx', xlsx(database));

        router.get('/:table/', getManyAPI(database));
        router.get('/:table/one', getOneWhereAPI(database));
        router.get('/:table/:id', getOneByIdAPI(database));

        router.put('/:table/findOrCreate', updateOrCreateWhereAPI(database));
        router.put('/:table/:id', updateOneByIDAPI(database));
        router.put('/:table/', updateWhereAPI(database));

        router.delete('/:table/drop', drop(database));
        router.delete('/:table/:id', deleteOneByIdAPI(database));
    }
    return router
};
