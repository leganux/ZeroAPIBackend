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
    deleteOneByIdAPI, StatisticsAPI
} = require('./api.controller');

const router = express.Router();


module.exports = function (middleware = false, database = 'api') {
    if (middleware) {
        router.post('/:table/many', middleware, createManyAPI(database));
        router.post('/:table/', middleware, createOneAPI(database));

        router.get('/:table/statistics', middleware, StatisticsAPI(database));

        router.get('/:table/', middleware, getManyAPI(database));
        router.get('/:table/one', middleware, getOneWhereAPI(database));
        router.get('/:table/:id', middleware, getOneByIdAPI(database));

        router.put('/:table/findOrCreate', middleware, updateOrCreateWhereAPI(database));
        router.put('/:table/:id', middleware, updateOneByIDAPI(database));
        router.put('/:table/', middleware, updateWhereAPI(database));

        router.delete('/:table/:id', middleware, deleteOneByIdAPI(database));
    } else {
        router.post('/:table/many', createManyAPI(database));
        router.post('/:table/', createOneAPI(database));

        router.get('/:table/statistics', StatisticsAPI(database));

        router.get('/:table/', getManyAPI(database));
        router.get('/:table/one', getOneWhereAPI(database));
        router.get('/:table/:id', getOneByIdAPI(database));

        router.put('/:table/findOrCreate', updateOrCreateWhereAPI(database));
        router.put('/:table/:id', updateOneByIDAPI(database));
        router.put('/:table/', updateWhereAPI(database));

        router.delete('/:table/:id', deleteOneByIdAPI(database));
    }
    return router
};
