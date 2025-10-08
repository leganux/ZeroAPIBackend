const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');

const BASE_URL = 'http://localhost:3000/api';
const TEST_TABLE = 'test_import_export';

const testData = [
    { name: 'John Doe', age: 30, email: 'john@example.com' },
    { name: 'Jane Smith', age: 25, email: 'jane@example.com' },
    { name: 'Bob Johnson', age: 35, email: 'bob@example.com' },
];

async function runTest(flavor) {
    console.log(`Testing ${flavor} database...`);

    try {
        // Create test data
        const createResponse = await axios.post(`${BASE_URL}/${TEST_TABLE}/many`, testData);
        console.log('Test data created:', createResponse.data);

        // Export to JSON
        const jsonExportResponse = await axios.get(`${BASE_URL}/${TEST_TABLE}/json`, { responseType: 'arraybuffer' });
        fs.writeFileSync(`${TEST_TABLE}_${flavor}.json`, jsonExportResponse.data);
        console.log('Data exported to JSON');

        // Export to Excel
        const excelExportResponse = await axios.get(`${BASE_URL}/${TEST_TABLE}/xlsx`, { responseType: 'arraybuffer' });
        fs.writeFileSync(`${TEST_TABLE}_${flavor}.xlsx`, excelExportResponse.data);
        console.log('Data exported to Excel');

        // Clear the table
        await axios.delete(`${BASE_URL}/${TEST_TABLE}/drop`);
        console.log('Table cleared');

        // Import from JSON
        const jsonFormData = new FormData();
        jsonFormData.append('file', fs.createReadStream(`${TEST_TABLE}_${flavor}.json`));
        await axios.post(`${BASE_URL}/${TEST_TABLE}/json`, jsonFormData, {
            headers: jsonFormData.getHeaders()
        });
        console.log('Data imported from JSON');

        // Verify JSON import
        const jsonImportVerify = await axios.get(`${BASE_URL}/${TEST_TABLE}`);
        console.log('JSON import verification:', jsonImportVerify.data);

        // Clear the table again
        await axios.delete(`${BASE_URL}/${TEST_TABLE}/drop`);
        console.log('Table cleared');

        // Import from Excel
        const excelFormData = new FormData();
        excelFormData.append('file', fs.createReadStream(`${TEST_TABLE}_${flavor}.xlsx`));
        await axios.post(`${BASE_URL}/${TEST_TABLE}/xlsx`, excelFormData, {
            headers: excelFormData.getHeaders()
        });
        console.log('Data imported from Excel');

        // Verify Excel import
        const excelImportVerify = await axios.get(`${BASE_URL}/${TEST_TABLE}`);
        console.log('Excel import verification:', excelImportVerify.data);

        console.log(`${flavor} database test completed successfully.\n`);
    } catch (error) {
        console.error(`Error in ${flavor} database test:`, error.message);
        if (error.response) {
            console.error('Error response:', error.response.data);
        }
    }
}

async function runAllTests() {
    const flavors = ['tingo', 'mongodb', 'sqlite'];
    for (const flavor of flavors) {
        await runTest(flavor);
    }
}

runAllTests().then(() => console.log('All tests completed.'));
