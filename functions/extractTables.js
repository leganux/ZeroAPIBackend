const puppeteer = require('puppeteer');
const cheerio = require('cheerio');

async function extractTables(url) {
    // Lanzar navegador y abrir nueva página
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    // Navegar a la URL
    await page.goto(url, {waitUntil: 'networkidle2'});

    // Obtener el contenido HTML de la página
    const content = await page.content();

    // Cargar el contenido HTML en cheerio
    const $ = cheerio.load(content);

    // Encontrar todas las tablas
    const tables = $('table');
    const tablesData = {};

    // Iterar sobre cada tabla
    tables.each((i, table) => {
        const tableName = `table${i + 1}`;
        const tableData = [];
        const headers = [];

        // Obtener encabezados de la tabla
        $(table).find('tr').first().find('th').each((j, header) => {
            headers.push($(header).text().trim());
        });

        // Si no hay encabezados, usa los índices como claves
        const useIndexAsKey = headers.length === 0;

        // Obtener datos de las filas de la tabla
        $(table).find('tr').each((j, row) => {
            if (j === 0 && !useIndexAsKey) return; // Saltar fila de encabezados si hay encabezados

            const rowData = {};
            $(row).find('td').each((k, cell) => {
                const key = useIndexAsKey ? `field${k + 1}` : headers[k];
                rowData[key] = $(cell).text().trim();
            });

            if (Object.keys(rowData).length > 0) {
                tableData.push(rowData);
            }
        });

        tablesData[tableName] = tableData;
    });

    // Cerrar el navegador
    await browser.close();

    return tablesData;
}

module.exports = extractTables


