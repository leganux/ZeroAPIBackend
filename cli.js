#! /usr/bin/env node
const {program} = require('commander')

const express = require('express');
const apiRoutes = require('./api/api.routes');
const coreRoutes = require('./core/core.routes');
const bodyParser = require('body-parser');

program
    .command('run')
    .description('Starts services for ZeroApiBackend')
    .option('-p, --port <port...>', 'Port where the app will run')
    .option('-c, --config <config...>', 'The path of json config file for ACL and defualt configs ')
    .action(async function ({port, config}) {

        console.log(`
          ______                      _____ _____ ____             _                  _ 
 |___  /                /\\   |  __ \\_   _|  _ \\           | |                | |
    / / ___ _ __ ___   /  \\  | |__) || | | |_) | __ _  ___| | _____ _ __   __| |
   / / / _ \\ '__/ _ \\ / /\\ \\ |  ___/ | | |  _ < / _\` |/ __| |/ / _ \\ '_ \\ / _\` |
  / /_|  __/ | | (_) / ____ \\| |    _| |_| |_) | (_| | (__|   <  __/ | | | (_| |
 /_____\\___|_|  \\___/_/    \\_\\_|   |_____|____/ \\__,_|\\___|_|\\_\\___|_| |_|\\__,_|
 
 Welcome to ZeroAPIBackend By leganux.net
 This software allows you to start an API with a 0 lines of code
                      
 Read the docs at https://github.com/leganux/ZeroAPIBackend or visit https://leganux.com for more information                                                         
                                                               
        `)

        if (!port || port.legth < 1) {
            port = 3000;
        } else {
            port = Number(port[0])
        }


        let app = express();

        let middleware = false
        let core = true
        let options = {
            login: true, register: true, forgotPassword: true, autoactivate: true
        }

        app.use(bodyParser.urlencoded({extended: true}));
        app.use(bodyParser.json());

        app.use('/api', apiRoutes(middleware));
        app.use('/', coreRoutes(core, options));

        app.all('/', function (req, res) {
            try {

                res.status(200).json({
                    data: 'Welcome to ZeroApiBackend docs',
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
        app.all('*', function (req, res) {
            try {

                res.status(404).json({
                    data: 'Visit ZeroApiBackend docs',
                    message: 'Not found',
                    status: 404
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
            console.log(`Server is running on http://localhost:${port} 
            Press ctrl + c to exit cli`);
        });
    })


program.parse()
