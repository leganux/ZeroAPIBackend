const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');

const BASE_URL = 'http://localhost:3000/api';
const TABLE_NAME = 'test_table';

async function runTests() {
    try {
        console.log('Starting tests...');

        // Create Multiple Records
        const createManyResponse = await axios.post(`${BASE_URL}/${TABLE_NAME}/many`, [
            { name: 'John Doe', email: 'john@example.com', age: 30 },
            { name: 'Jane Smith', email: 'jane@example.com', age: 25 }
        ]);
        console.log('Create Many Response:', createManyResponse.data);

        // Create a Single Record
        const createOneResponse = await axios.post(`${BASE_URL}/${TABLE_NAME}`, {
            name: 'Alice Johnson',
            email: 'alice@example.com',
            age: 35
        });
        console.log('Create One Response:', createOneResponse.data);

        // Get Multiple Records
        const getManyResponse = await axios.get(`${BASE_URL}/${TABLE_NAME}`);
        console.log('Get Many Response:', getManyResponse.data);

        // Get a Single Record Based on Conditions
        const getOneWhereResponse = await axios.get(`${BASE_URL}/${TABLE_NAME}/one?where[name]=John Doe`);
        console.log('Get One Where Response:', getOneWhereResponse.data);

        // Get a Single Record by ID
        const id = getManyResponse.data.data[0]._id;
        const getByIdResponse = await axios.get(`${BASE_URL}/${TABLE_NAME}/${id}`);
        console.log('Get By ID Response:', getByIdResponse.data);

        // Update or Create a Record
        const updateOrCreateResponse = await axios.put(`${BASE_URL}/${TABLE_NAME}/findOrCreate`, {
            name: 'Bob Wilson',
            email: 'bob@example.com',
            age: 40
        });
        console.log('Update or Create Response:', updateOrCreateResponse.data);

        // Update a Record by ID
        try {
            const updateByIdResponse = await axios.put(`${BASE_URL}/${TABLE_NAME}/${id}`, {
                age: 31
            });
            console.log('Update By ID Response:', updateByIdResponse.data);
        } catch (error) {
            console.error('Update By ID Error:', error.response ? error.response.data : error.message);
        }

        // Verify the update
        try {
            const verifyUpdateResponse = await axios.get(`${BASE_URL}/${TABLE_NAME}/${id}`);
            console.log('Verify Update Response:', verifyUpdateResponse.data);
        } catch (error) {
            console.error('Verify Update Error:', error.response ? error.response.data : error.message);
        }

        // Update Records Based on Conditions
        const updateWhereResponse = await axios.put(`${BASE_URL}/${TABLE_NAME}?where[age]=25`, {
            age: 26
        });
        console.log('Update Where Response:', updateWhereResponse.data);

        // Get statistics
        const statisticsResponse = await axios.get(`${BASE_URL}/${TABLE_NAME}/statistics?select=age`);
        console.log('Statistics Response:', statisticsResponse.data);

        // Export to JSON
        const jsonExportResponse = await axios.get(`${BASE_URL}/${TABLE_NAME}/json`);
        console.log('JSON Export Response:', jsonExportResponse.data);

        // Export to Excel
        const excelExportResponse = await axios.get(`${BASE_URL}/${TABLE_NAME}/xlsx`, { responseType: 'arraybuffer' });
        fs.writeFileSync('export.xlsx', excelExportResponse.data);
        console.log('Excel file exported as export.xlsx');

        // Import from JSON
        // const jsonImportData = JSON.stringify([{ name: 'Imported JSON', age: 50 }]);
        // const jsonFormData = new FormData();
        // jsonFormData.append('file', Buffer.from(jsonImportData), {
        //     filename: 'test.json',
        //     contentType: 'application/json',
        // });
        // const jsonImportResponse = await axios.post(`${BASE_URL}/${TABLE_NAME}/json`, jsonFormData, {
        //     headers: jsonFormData.getHeaders()
        // });
        // console.log('JSON Import Response:', jsonImportResponse.data);

        // Import from Excel
        // const excelBuffer = fs.readFileSync('export.xlsx');
        // const excelFormData = new FormData();
        // excelFormData.append('file', excelBuffer, {
        //     filename: 'test.xlsx',
        //     contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        // });
        // const excelImportResponse = await axios.post(`${BASE_URL}/${TABLE_NAME}/xlsx`, excelFormData, {
        //     headers: excelFormData.getHeaders()
        // });
        // console.log('Excel Import Response:', excelImportResponse.data);

        // Big Query
        const bigQueryResponse = await axios.post(`${BASE_URL}/${TABLE_NAME}/bigquery`, {
            where: { age: { $gte: 30 } },
            like: { name: 'John' },
            paginate: { page: 0, limit: 10 },
            sort: { age: -1 },
            populate: [{ localField: 'email', table: 'users', foreignField: 'email', fields: ['name'] }]
        });
        console.log('Big Query Response:', bigQueryResponse.data);

        // Delete a Record by ID
        const deleteByIdResponse = await axios.delete(`${BASE_URL}/${TABLE_NAME}/${id}`);
        console.log('Delete By ID Response:', deleteByIdResponse.data);

        console.log('All tests completed successfully!');
    } catch (error) {
        console.error('Error during tests:', error.response ? error.response.data : error.message);
    }
}

runTests();
