const express = require('express');
const apiRoutes = require('./api/api.routes');
const coreRoutes = require('./core/core.routes');
const bodyParser = require('body-parser');


const app = express();
const port = 3000;
let middleware = false
let core = true

let options = {
    login: true, register: true, forgotPassword: true, autoactivate: true
}


app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use('/api', apiRoutes(middleware));
app.use('/', coreRoutes(core, options));
app.all('/', async function (req, res) {
    try {

        res.status(200).json({
            data: {

            },
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
