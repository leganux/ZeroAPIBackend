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
    deleteOneByIdAPI
} = require('./api.controller');

const router = express.Router();






module.exports = function (middleware = false) {
    if (middleware) {
        router.post('/:table/many', middleware, createManyAPI);
        router.post('/:table/', middleware, createOneAPI);

        router.get('/:table/', middleware, getManyAPI);
        router.get('/:table/one', middleware, getOneWhereAPI);
        router.get('/:table/:id', middleware, getOneByIdAPI);

        router.put('/:table/findOrCreate', middleware, updateOrCreateWhereAPI);
        router.put('/:table/:id', middleware, updateOneByIDAPI);
        router.put('/:table/', middleware, updateWhereAPI);

        router.delete('/:table/:id', middleware, deleteOneByIdAPI);
    } else {
        router.post('/:table/many', createManyAPI);
        router.post('/:table/', createOneAPI);

        router.get('/:table/', getManyAPI);
        router.get('/:table/one', getOneWhereAPI);
        router.get('/:table/:id', getOneByIdAPI);

        router.put('/:table/findOrCreate', updateOrCreateWhereAPI);
        router.put('/:table/:id', updateOneByIDAPI);
        router.put('/:table/', updateWhereAPI);

        router.delete('/:table/:id', deleteOneByIdAPI);
    }
    return router
};
