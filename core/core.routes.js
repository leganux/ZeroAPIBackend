const express = require('express');
const { signUp, activate, describe } = require('./core.controller')
const { initializeDb } = require('./../database');


const router = express.Router();
router.get('/database/describe', describe)


module.exports = function (core = false, {
    login, register, forgotPassword, autoactivate, mailSettings
}) {
    if (core) {
        if (register) {
            router.post('/auth/signup/:role', signUp(autoactivate, mailSettings));
            router.post('/auth/activate/:code', activate);
        }
        return router
    } else {
        return router
    }
};
