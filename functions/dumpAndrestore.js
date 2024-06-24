const fs = require('fs-extra');
const archiver = require('archiver');
const unzipper = require('unzipper');

// Función para comprimir una carpeta completa
async function dump(inputDirPath, outputZipPath) {
    return new Promise((resolve, reject) => {
        // Crear un flujo de escritura para el archivo ZIP de salida
        const output = fs.createWriteStream(outputZipPath);
        const archive = archiver('zip', {zlib: {level: 9}});

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

        // Añadir la carpeta a comprimir al archivo ZIP
        archive.directory(inputDirPath, false);

        // Finalizar la compresión
        archive.finalize();
    });
}

// Función para descomprimir un archivo ZIP a una carpeta
async function restore(zipFilePath, outputDirPath) {
    return new Promise((resolve, reject) => {
        // Crear un flujo de lectura para el archivo ZIP de entrada
        fs.createReadStream(zipFilePath)
            .pipe(unzipper.Extract({path: outputDirPath}))
            .on('close', () => {
                console.log(`Archivo descomprimido con éxito en: ${outputDirPath}`);
                resolve();
            })
            .on('error', err => {
                reject(err);
            });
    });
}

module.exports = {dump, restore}
