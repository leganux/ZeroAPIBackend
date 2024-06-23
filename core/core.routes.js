const express = require('express');
const {signUp, activate, describe} = require('./core.controller')


const router = express.Router();
module.exports = function (core = false, {
    login,
    register,
    forgotPassword,
    autoactivate,
    mailSettings, database
}) {

    router.get('/database/describe', describe(database))

    if (core) {
        if (register) {
            router.post('/auth/signup/:role', signUp(autoactivate, mailSettings));
            router.post('/auth/activate/:code', activate);
        }

    }
    return router
};
