# ZeroAPIBackend

The first Zero code API backend - API rest ready to be consumed, no database needed no definition or code neeeded

ZeroAPIBackend is a CLI tool that allows you to instantly create a REST API by simply running zeroAPI run -p 5050. This
tool requires no database setup, table definitions, or complex configurations. Everything is generated on the fly,
offering a hassle-free solution for rapid API development.

## Features

* <b>Automatic API Creation:</b> Launch a fully functional REST API with a single command.
* <b>No Database Setup Required:</b>  Avoid the complexities of setting up and managing a database.
* <b>Dynamic Table Handling:</b>  Create, read, update, and delete records in any table without predefined schemas.

## Get started

#### Prerequisites

* Install node js 20+ and npm

### Install

````bash 
npm install -g zeroapibackend
````

### Run

To execute in default port 3000 only run and then visit http://localhost:3000

````bash 
zeroAPI run
````

Or if you prefer define a custom port for example 5050 to execute and then visit http://localhost:5050

````bash 
zeroAPI run -p 5050
````

## How to use

### Endpoints

- Create Multiple Records:
    - POST /api/:table/many
        - Description: Create multiple records in the specified table.


- Create a Single Record:
    - POST /api/:table/
        - Description: Create a single record in the specified table.


- Get Multiple Records:
    - GET /api/:table/
        - Description: Retrieve multiple records from the specified table.


- Get a Single Record Based on Conditions:
    - GET /api/:table/one
        - Description: Retrieve a single record from the specified table that meets the specified conditions.


- Get a Single Record by ID:
    - GET /api/:table/:id
        - Description: Retrieve a single record by its ID from the specified table.


- Update or Create a Record:
    - PUT /api/:table/findOrCreate
        - Description: Update an existing record or create a new one in the specified table.


- Update a Record by ID:
    - PUT /api/:table/:id
        - Description: Update a record by its ID in the specified table.


- Update Records Based on Conditions:
    - PUT /api/:table/
        - Description: Update records in the specified table that meet the specified conditions.


- Delete a Record by ID:
    - DELETE /api/:table/:id
        - Description: Delete a record by its ID from the specified table.

### Query parameters

To use query parameters in the API routes, you can specify various parameters in the URL that will modify the behavior
of the CRUD operations. Below are some examples of how to use these parameters:

1. select: Field Selection
   The select parameter is used to specify the fields you want to include in the response.

   Example: Retrieve only the name and email fields from the records in the users table:

```bash 
curl -X GET "http://localhost:3000/api/users/?select=name,email"
```

2. where: Specific Conditions
   The where parameter is used to filter records based on certain conditions.

   Example: Retrieve all records from the users table where age is equal to 30:

```bash 
curl -X GET "http://localhost:3000/api/users/?where[age]=30"
```

3. paginate: Pagination
   The paginate parameter is used to paginate the results, specifying the number of records per page and the page
   number.

   Example: Retrieve the second page of records from the users table, with 10 records per page:

```bash 
curl -X GET "http://localhost:3000/api/users/?paginate[limit]=10&paginate[page]=1"
```

4. sort: Sorting
   The sort parameter is used to sort the results based on one or more fields.

   Example: Retrieve all records from the users table sorted by createdAt in descending order:

```bash 
curl -X GET "http://localhost:3000/api/users/?sort[createdAt]=-1"
```

5. populate: Relationships
   The populate parameter is used to include related documents from other collections.

   Example: Retrieve all records from the orders table and include the details of the related users:

```bash 
curl -X GET "http://localhost:3000/api/orders/?populate[localFields]=userId&populate[tables]=users&populate[foreignFields]=_id"

```

### Combined Examples
You can combine several query parameters to perform more complex queries.

Example: Retrieve the first page of records from the users table, with 5 records per page, only the name and email
fields, sorted by createdAt in ascending order, and where age is equal to 25:

```bash 
curl -X GET "http://localhost:3000/api/users/?select=name,email&paginate[limit]=5&paginate[page]=0&sort[createdAt]=1&where[age]=25"
```

### Usage in Create Operations
You can use select, populate, and other parameters in create operations to specify which fields to include in the response and how to relate the new documents.

Example: Create a new record in the users table and return only the name and email fields:
```bash 
curl -X POST "http://localhost:3000/api/users/?select=name,email" -H "Content-Type: application/json" -d '{
    "name": "Jane Doe",
    "email": "jane.doe@example.com",
    "age": 28
}'

```
