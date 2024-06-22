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

You can use select, populate, and other parameters in create operations to specify which fields to include in the
response and how to relate the new documents.

Example: Create a new record in the users table and return only the name and email fields:

```bash 
curl -X POST "http://localhost:3000/api/users/?select=name,email" -H "Content-Type: application/json" -d '{
    "name": "Jane Doe",
    "email": "jane.doe@example.com",
    "age": 28
}'

```

## Detailed Explanation of How Populates Work in the Library

The populateConstructor function is used to fetch related data from other tables and incorporate it into the main query
result. This mimics the behavior of SQL joins in a NoSQL database by manually linking documents based on specified
fields.

## How populateConstructor Works

1. Parameter Parsing:

The populate object contains localFields, tables, and foreignFields, which are comma-separated strings specifying the
fields and tables involved in the population.
These strings are split into arrays for further processing.

2. Iteration Over Records:

For each item in the list_of_elements (the main query result), the function iterates over the specified fields and
tables.
For each field-table combination, a filter is constructed to match the related documents in the foreign table.

3. Filter Construction:

If the value of the localField in the current item is a string, a simple equality filter is created.
If the value is an array, an $in filter is created to match any of the values in the array.

4. Field Selection:

If populateFields are specified, only the indicated fields are selected from the foreign table.

5. Database Query:

The function initializes the connection to the foreign table and executes the query with the constructed filter and
field selection.
The results are stored back into the original item, replacing the localField value with the related documents.

6. Final Assembly:

The populated items are collected into a new array and returned.
Example of Using Populates in CLI
To use the populate parameter in your CLI to fetch related data from other tables, follow this example:

## Scenario

You have two collections: orders and users. Each order document has a userId field referencing a user. You want to
retrieve orders and include user details in the result.

```bash 
curl -X GET "http://localhost:3000/api/orders/?populate[localFields]=userId&populate[tables]=users&populate[foreignFields]=_id"
```

### How the Example Works

1. Query URL:

* The URL specifies the orders table and includes the populate parameter with localFields, tables, and foreignFields.
* localFields=userId: Indicates the field in the orders collection that references the users collection.
* tables=users: Specifies the foreign table (users) to fetch data from.
* foreignFields=_id: Specifies the field in the users collection that matches the userId field in the orders collection.

2. Result:

* The server will process the request, fetch orders, and for each order, it will look up the corresponding user in the
  users collection.
* The userId in each order will be replaced with the full user document.

## Extended Example with Field Selection

You can also specify which fields to include from the related documents using populateFields.

Example Command

```bash 
curl -X GET "http://localhost:3000/api/orders/?populate[localFields]=userId&populate[tables]=users&populate[foreignFields]=_id&populateFields[users]=name,email"
```

### How the Extended Example Works

1. Query URL:

* The URL includes an additional populateFields parameter specifying which fields to include from the users collection.
  populateFields[users]=name,email: Indicates that only the name and email fields from the users collection should be
  included in the response.

2. Result:

* The server will fetch orders and populate the userId field with user documents that include only the name and email
  fields.
