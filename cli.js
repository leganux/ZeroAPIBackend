#! /usr/bin/env node
const { program } = require('commander');
const express = require('express');
const apiRoutes = require('./api/api.routes');
const coreRoutes = require('./core/core.routes');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const ngrok = require('ngrok');
const { dump, restore } = require("./functions/dumpAndrestore");
const fs = require('fs-extra');
const path = require('path');
const moment = require('moment');
const os = require('os');

// Database connections
const { connectTingoDB, connectMongoDB, connectSQLite } = require('./database');


program
    .command('run')
    .description('Starts services for ZeroApiBackend')
    .option('-p, --port <port...>', 'Port where the app will run')
    .option('-d, --database <database...>', 'Custom database name to store information')
    .option('-c, --config <config...>', 'The path of json config file for ACL and configs')
    .option('-n, --ngr <ngr...>', 'true or ngrok token to automatically make public your database to the world. (Ensure you protect your endpoints)')
    .option('--flavor <flavor>', 'Database flavor to use (tingo, sqlite, mongodb)', 'tingo')
    .option('--dblocation <dblocation>', 'Path for SQLite database file')
    .option('--dburi <dburi>', 'MongoDB connection URI')
    .option('--cfg <cfg>', 'Path to JSON configuration file')
    .action(async function ({ port, config, database, ngr, flavor, dblocation, dburi, cfg }) {
        let configOptions = {};
        if (cfg) {
            try {
                const configContent = fs.readFileSync(cfg, 'utf8');
                configOptions = JSON.parse(configContent);
            } catch (error) {
                console.error('Error reading config file:', error);
                process.exit(1);
            }
        }

        // Merge command line options with config file options, prioritizing command line
        const options = {
            ...configOptions,
            port: port || configOptions.port,
            database: database || configOptions.database,
            ngr: ngr || configOptions.ngr,
            flavor: flavor || configOptions.flavor,
            dblocation: dblocation || configOptions.dblocation,
            dburi: dburi || configOptions.dburi,
            config: config || configOptions.config
        };

        if (!options.port || (Array.isArray(options.port) && options.port.length < 1)) {
            options.port = 3000;
        } else if (Array.isArray(options.port)) {
            options.port = Number(options.port[0]);
        } else {
            options.port = Number(options.port);
        }

        if (!options.database || (Array.isArray(options.database) && options.database.length < 1)) {
            options.database = 'api';
        } else if (Array.isArray(options.database)) {
            options.database = options.database[0];
        }

        if (Array.isArray(options.ngr) && options.ngr.length > 0) {
            options.ngr = options.ngr[0];
        }

        if (Array.isArray(options.config) && options.config.length > 0) {
            options.config = options.config[0];
        }


        if (!port || port.legth < 1) {
            port = 3000;
        } else {
            port = Number(port[0])
        }

        if (!database || database.length < 1) {
            database = 'api';
        } else {
            database = database[0];
        }

        // Set default values for dblocation and dburi
        if (!options.dblocation) {
            options.dblocation = path.join(os.homedir(), 'zeroApi', 'database.db');
        }
        if (!options.dburi) {
            options.dburi = 'mongodb://localhost/zeroApi';
        }

        let app = express();
        let middleware = false;
        let core = true;

        // Ensure options.port is a number
        options.port = Number(options.port);

        const serverOptions = {
            ...options,
            login: true,
            register: true,
            forgotPassword: true,
            autoactivate: true,
        };

        // Connect to the appropriate database
        let db;
        switch (options.flavor) {
            case 'tingo':
                db = await connectTingoDB(options.database);
                break;
            case 'sqlite':
                db = await connectSQLite(options.dblocation);
                break;
            case 'mongodb':
                db = await connectMongoDB(options.dburi);
                break;
            default:
                console.error('Invalid database flavor');
                process.exit(1);
        }

        // Pass the database connection to the routes
        app.set('db', db);


        app.use(morgan(function (tokens, req, res) {
            return [tokens.method(req, res), tokens.url(req, res), tokens.status(req, res), tokens.res(req, res, 'content-length'), '-', tokens['response-time'](req, res), 'ms'].join(' ')
        }))

        app.use(bodyParser.urlencoded({extended: true}));
        app.use(bodyParser.json());

        app.use('/api', apiRoutes(middleware, serverOptions.database));
        app.use('/', coreRoutes(core, serverOptions));

        app.all('/', function (req, res) {
            try {

                res.status(200).json({
                    data: 'Welcome to ZeroApiBackend docs', message: 'API Started succesfull - Ok', status: 200
                })
            } catch (e) {
                console.error(e)
                res.status(500).json({
                    error: e, message: 'Internal server error', status: 500
                })
            }

        })
        app.use(function (req, res, next) {
            res.status(404).json({
                data: 'Visit ZeroApiBackend docs', message: 'Not found', status: 404
            });
        });

        app.use(function (err, req, res, next) {
            console.error(err);
            res.status(500).json({
                error: err, message: 'Internal server error', status: 500
            });
        });

        await app.listen(port)
        let url

        if (ngr && ngr.length > 0) {
            ngr = ngr[0]
            console.log('Try to connect ngrok ' + ngr)
            try {
                url = await ngrok.connect({
                    authtoken: ngr, addr: port, onLogEvent: console.log, onStatusChange: console.log
                });

            } catch (e) {

                url = await ngrok.connect({addr: port, onLogEvent: console.log, onStatusChange: console.log});


            }
        }

        console.log(`
  ______                      _____ _____ ____             _                  _ 
 |___  /                /\\   |  __ \\_   _|  _ \\           | |                | |
    / / ___ _ __ ___   /  \\  | |__) || | | |_) | __ _  ___| | _____ _ __   __| |
   / / / _ \\ '__/ _ \\ / /\\ \\ |  ___/ | | |  _ < / _\` |/ __| |/ / _ \\ '_ \\ / _\` |
  / /_|  __/ | | (_) / ____ \\| |    _| |_| |_) | (_| | (__|   <  __/ | | | (_| |
 /_____\\___|_|  \\___/_/    \\_\\_|   |_____|____/ \\__,_|\\___|_|\\_\\___|_| |_|\\__,_|
 
 Welcome to ZeroAPIBackend By leganux.net
 The first API rest in the world for developers and data experts
                      
 Read the docs at https://github.com/leganux/ZeroAPIBackend or visit https://leganux.com for more information                                                         
                                                               
        `)

        console.log(`Server options:`, JSON.stringify(serverOptions, null, 2));
        console.log(`Server is running on http://localhost:${serverOptions.port} and ${url || 'No ngrok configured'}
          Press ctrl + c to exit cli`);
    })


program
    .command('dump')
    .description('Dumps a database by name')
    .option('-d, --dir <dir...>', 'Full path dir where dump will be saved')
    .option('-n, --name <name...>', 'Database name')
    .action(async function ({name, dir}) {
        console.log(`
  ______                      _____ _____ ____             _                  _ 
 |___  /                /\\   |  __ \\_   _|  _ \\           | |                | |
    / / ___ _ __ ___   /  \\  | |__) || | | |_) | __ _  ___| | _____ _ __   __| |
   / / / _ \\ '__/ _ \\ / /\\ \\ |  ___/ | | |  _ < / _\` |/ __| |/ / _ \\ '_ \\ / _\` |
  / /_|  __/ | | (_) / ____ \\| |    _| |_| |_) | (_| | (__|   <  __/ | | | (_| |
 /_____\\___|_|  \\___/_/    \\_\\_|   |_____|____/ \\__,_|\\___|_|\\_\\___|_| |_|\\__,_|
 
 Welcome to ZeroAPIBackend By leganux.net
 The first API rest in the world for developers and data experts
                      
 Read the docs at https://github.com/leganux/ZeroAPIBackend or visit https://leganux.com for more information   
 
 ======================================= DUMP ==================================================================                                                      
                                                               
        `)
        if (name && name.length > 0 && dir && dir.length > 0) {
            name = name[0]
            dir = dir[0]

            dir = path.resolve(dir)
            console.log(dir)
            let source = path.join(__dirname, 'local', name)
            await fs.ensureDir(dir);
            let dest = path.join(dir, 'ZeroApiDump_' + moment().format('YYYYMMDDHHmmss') + '_' + name + '.zip')

            await dump(source, dest)

            console.log('exported to ' + dest)

        } else {
            console.log('Please insert correct parameters to continue ')
        }


    })
program

    .command('restore')
    .description('Restore a database by name from a zip file (the function will replace al files)')
    .option('-d, --dir <dir...>', 'Full path dir of source zip')
    .option('-n, --name <name...>', 'Database name')
    .action(async function ({name, dir}) {
        console.log(`
  ______                      _____ _____ ____             _                  _ 
 |___  /                /\\   |  __ \\_   _|  _ \\           | |                | |
    / / ___ _ __ ___   /  \\  | |__) || | | |_) | __ _  ___| | _____ _ __   __| |
   / / / _ \\ '__/ _ \\ / /\\ \\ |  ___/ | | |  _ < / _\` |/ __| |/ / _ \\ '_ \\ / _\` |
  / /_|  __/ | | (_) / ____ \\| |    _| |_| |_) | (_| | (__|   <  __/ | | | (_| |
 /_____\\___|_|  \\___/_/    \\_\\_|   |_____|____/ \\__,_|\\___|_|\\_\\___|_| |_|\\__,_|
 
 Welcome to ZeroAPIBackend By leganux.net
 The first API rest in the world for developers and data experts
                      
 Read the docs at https://github.com/leganux/ZeroAPIBackend or visit https://leganux.com for more information   
 
 ======================================= RESTORE ==================================================================                                                      
                                                               
        `)
        if (name && name.length > 0 && dir && dir.length > 0) {
            name = name[0]
            dir = dir[0]
            dir = path.resolve(dir)
            let dest = path.join(__dirname, 'local', name)
            await fs.ensureDir(dest);
            await restore(dir, dest)

            console.log('restored correctly ' + dir)

        } else {
            console.log('Please insert correct parameters to continue ')
        }
    })

program
    .command('drop')
    .description('Drop a database by name')
    .option('-n, --name <name...>', 'Database name')
    .action(async function ({name}) {
        console.log(`
  ______                      _____ _____ ____             _                  _ 
 |___  /                /\\   |  __ \\_   _|  _ \\           | |                | |
    / / ___ _ __ ___   /  \\  | |__) || | | |_) | __ _  ___| | _____ _ __   __| |
   / / / _ \\ '__/ _ \\ / /\\ \\ |  ___/ | | |  _ < / _\` |/ __| |/ / _ \\ '_ \\ / _\` |
  / /_|  __/ | | (_) / ____ \\| |    _| |_| |_) | (_| | (__|   <  __/ | | | (_| |
 /_____\\___|_|  \\___/_/    \\_\\_|   |_____|____/ \\__,_|\\___|_|\\_\\___|_| |_|\\__,_|
 
 Welcome to ZeroAPIBackend By leganux.net
 The first API rest in the world for developers and data experts
                      
 Read the docs at https://github.com/leganux/ZeroAPIBackend or visit https://leganux.com for more information   
 
 ======================================= DROP TABLE ==================================================================                                                      
                                                               
        `)
        if (name && name.length > 0) {
            name = name[0]

            let dest = path.join(__dirname, 'local', name)
            await fs.remove(dest);

            console.log('Database dropped  correctly ')

        } else {
            console.log('Please insert correct parameters to continue ')
        }
    })
program.parse()
