const express = require('express');
const apiRoutes = require('./api/api.routes');
const coreRoutes = require('./core/core.routes');
const bodyParser = require('body-parser');

const morgan = require('morgan')

const app = express();
const port = 3000;
let middleware = false
let core = true
let database = 'api'


let options = {
    login: true, register: true, forgotPassword: true, autoactivate: true, database
}


app.use(morgan(function (tokens, req, res) {
    return [
        tokens.method(req, res),
        tokens.url(req, res),
        tokens.status(req, res),
        tokens.res(req, res, 'content-length'), '-',
        tokens['response-time'](req, res), 'ms'
    ].join(' ')
}))

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

app.use('/api', apiRoutes(middleware, database));
app.use('/', coreRoutes(core, options));
app.all('/', async function (req, res) {
    try {

        res.status(200).json({
            data: {},
            message: 'API Started succesfull - Ok',
            status: 200
        })
    } catch (e) {
        console.error(e)
        res.status(500).json({
            error: e,
            message: 'Internal server error',
            status: 500
        })
    }

})

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
