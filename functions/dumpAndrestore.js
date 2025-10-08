const fs = require('fs-extra');
const archiver = require('archiver');
const unzipper = require('unzipper');
const path = require('path');
const { MongoClient } = require('mongodb');
const sqlite3 = require('sqlite3').verbose();

// Función para comprimir una carpeta completa
async function dump(inputDirPath, outputZipPath, flavor, dburi, dblocation) {
    return new Promise(async (resolve, reject) => {
        const output = fs.createWriteStream(outputZipPath);
        const archive = archiver('zip', { zlib: { level: 9 } });

        // Manejar los eventos del flujo de escritura
        output.on('close', () => {
            console.log(`Carpeta comprimida con éxito: ${outputZipPath}`);
            resolve();
        });

        output.on('end', () => {
            console.log('Datos de archivo terminados');
        });

        output.on('error', err => {
            reject(err);
        });

        // Conectar el flujo de escritura al archivo ZIP
        archive.pipe(output);

        if (flavor === 'tingo') {
            archive.directory(inputDirPath, false);
        } else if (flavor === 'mongodb') {
            const client = await MongoClient.connect(dburi, { useNewUrlParser: true, useUnifiedTopology: true });
            const db = client.db();
            const collections = await db.listCollections().toArray();

            for (const collection of collections) {
                const data = await db.collection(collection.name).find().toArray();
                archive.append(JSON.stringify(data), { name: `${collection.name}.json` });
            }

            await client.close();
        } else if (flavor === 'sqlite') {
            const db = new sqlite3.Database(dblocation);
            const tables = await new Promise((resolve, reject) => {
                db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
                    if (err) reject(err);
                    else resolve(tables);
                });
            });

            for (const table of tables) {
                const data = await new Promise((resolve, reject) => {
                    db.all(`SELECT * FROM ${table.name}`, (err, rows) => {
                        if (err) reject(err);
                        else resolve(rows);
                    });
                });
                archive.append(JSON.stringify(data), { name: `${table.name}.json` });
            }

            db.close();
        }

        archive.finalize();
    });
}

// Función para descomprimir un archivo ZIP y restaurar la base de datos
async function restore(zipFilePath, outputDirPath, flavor, dburi, dblocation) {
    return new Promise(async (resolve, reject) => {
        try {
            await fs.ensureDir(outputDirPath);
            await unzipper.Open.file(zipFilePath).then(d => d.extract({ path: outputDirPath }));

            if (flavor === 'tingo') {
                console.log(`Archivo descomprimido con éxito en: ${outputDirPath}`);
                resolve();
            } else if (flavor === 'mongodb') {
                const client = await MongoClient.connect(dburi, { useNewUrlParser: true, useUnifiedTopology: true });
                const db = client.db();

                const files = await fs.readdir(outputDirPath);
                for (const file of files) {
                    if (file.endsWith('.json')) {
                        const collectionName = path.basename(file, '.json');
                        const data = JSON.parse(await fs.readFile(path.join(outputDirPath, file), 'utf8'));
                        await db.collection(collectionName).deleteMany({});
                        if (data.length > 0) {
                            await db.collection(collectionName).insertMany(data);
                        }
                    }
                }

                await client.close();
                console.log(`Base de datos MongoDB restaurada con éxito`);
                resolve();
            } else if (flavor === 'sqlite') {
                const db = new sqlite3.Database(dblocation);

                const files = await fs.readdir(outputDirPath);
                for (const file of files) {
                    if (file.endsWith('.json')) {
                        const tableName = path.basename(file, '.json');
                        const data = JSON.parse(await fs.readFile(path.join(outputDirPath, file), 'utf8'));
                        
                        await new Promise((resolve, reject) => {
                            db.run(`DELETE FROM ${tableName}`, (err) => {
                                if (err) reject(err);
                                else resolve();
                            });
                        });

                        if (data.length > 0) {
                            const columns = Object.keys(data[0]).join(', ');
                            const placeholders = Object.keys(data[0]).map(() => '?').join(', ');
                            const stmt = db.prepare(`INSERT INTO ${tableName} (${columns}) VALUES (${placeholders})`);

                            for (const row of data) {
                                await new Promise((resolve, reject) => {
                                    stmt.run(Object.values(row), (err) => {
                                        if (err) reject(err);
                                        else resolve();
                                    });
                                });
                            }

                            stmt.finalize();
                        }
                    }
                }

                db.close();
                console.log(`Base de datos SQLite restaurada con éxito`);
                resolve();
            }
        } catch (err) {
            reject(err);
        }
    });
}

module.exports = {dump, restore}
