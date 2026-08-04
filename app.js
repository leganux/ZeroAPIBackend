const express = require('express');
const rateLimit = require('express-rate-limit');
const apiRoutes = require('./api/api.routes');
const coreRoutes = require('./core/core.routes');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const {program} = require('commander');
const {createSchemaMiddleware} = require('./middlewares/schema.middleware');

// ---------------------------------------------------------------------------
// Lectura del flavor de BD: CLI arg > ENV variable > default ('api' = TingoDB)
// ---------------------------------------------------------------------------
program
    .option('--database <string>', 'Identificador de la base de datos (TingoDB: nombre de carpeta, SQLite: ruta .sqlite/.db, MongoDB: connection string mongodb://...)')
    .option('--port <number>', 'Puerto en el que arranca el servidor')
    .option('--schema <path>', 'Ruta al archivo JSON de schema para validación de rutas y campos')
    .option('--rate-limit <number>', 'Máximo de peticiones por segundo por IP (default: 3)')
    .allowUnknownOption()   // permite que nodemon/otros pase opciones extras sin error
    .parse(process.argv);

const cliOpts = program.opts();

// Prioridad: argumento CLI > variable de entorno > valor por defecto
const database = cliOpts.database || process.env.DATABASE || 'api';
const port = Number(cliOpts.port) || Number(process.env.PORT) || 3000;
const reqPerSecond = Number(cliOpts.rateLimit) || Number(process.env.RATE_LIMIT) || 3;

// ---------------------------------------------------------------------------
// Determina el tipo de BD para mostrarlo en consola al arrancar
// ---------------------------------------------------------------------------
function _detectDbType(db) {
    if (typeof db === 'string') {
        if (db.startsWith('mongodb://') || db.startsWith('mongodb+srv://')) return 'MongoDB (Mongoose)';
        if (db.startsWith('sqlite:') || db.endsWith('.sqlite') || db.endsWith('.db')) return 'SQLite (Sequelize)';
    }
    return 'TingoDB (local)';
}

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------
const app = express();

// Express 5 usa un query parser simple por defecto; 'extended' habilita
// el parseo de objetos/arrays anidados: ?where[name]=foo, ?paginate[page]=1, etc.
app.set('query parser', 'extended');

let middleware = false;
let core = true;

let options = {
    login: true, register: true, forgotPassword: true, autoactivate: true, database
};

app.use(morgan(function (tokens, req, res) {
    return [
        tokens.method(req, res),
        tokens.url(req, res),
        tokens.status(req, res),
        tokens.res(req, res, 'content-length'), '-',
        tokens['response-time'](req, res), 'ms'
    ].join(' ');
}));

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

// ---------------------------------------------------------------------------
// Rate limiting — configurable vía --rate-limit o RATE_LIMIT env var
// ---------------------------------------------------------------------------
app.use(rateLimit({
    windowMs: 1000,
    max: reqPerSecond,
    standardHeaders: true,
    legacyHeaders: false,
    message: {status: 429, message: 'Too many requests, slow down.'}
}));

// ---------------------------------------------------------------------------
// Schema middleware (opcional) — se activa con --schema <path>
// ---------------------------------------------------------------------------
const schemaPath = cliOpts.schema || process.env.SCHEMA;
if (schemaPath) {
    app.use(createSchemaMiddleware(schemaPath));
}

app.use('/api', apiRoutes(middleware, database));
app.use('/', coreRoutes(core, options));

app.all('/', async function (req, res) {
    try {
        res.status(200).json({
            data: {},
            message: 'API Started succesfull - Ok',
            status: 200
        });
    } catch (e) {
        console.error(e);
        res.status(500).json({
            error: e,
            message: 'Internal server error',
            status: 500
        });
    }
});

app.listen(port, () => {
    console.log('┌─────────────────────────────────────────────┐');
    console.log('│            ZeroAPI Backend                  │');
    console.log('├─────────────────────────────────────────────┤');
    console.log(`│  Server  : http://localhost:${port}             │`);
    console.log(`│  DB Type : ${_detectDbType(database).padEnd(33)}│`);
    console.log(`│  DB      : ${String(database).padEnd(33)}│`);
    console.log(`│  Rate    : ${String(reqPerSecond + ' req/s per IP').padEnd(33)}│`);
    if (schemaPath) {
        console.log(`│  Schema  : ${String(schemaPath).padEnd(33)}│`);
    }
    console.log('└─────────────────────────────────────────────┘');
});
