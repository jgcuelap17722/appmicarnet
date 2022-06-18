module.exports = {

  database: {
    connectionLimit: process.env.DB_CONNECTION_LIMIT,
    host           : process.env.DB_HOST,
    user           : process.env.DB_USER,
    password       : process.env.DB_PASS,
    database       : process.env.DB_DATABASE,
    port           : process.env.DB_PORT
  }
/*   database: {
    connectionLimit: 8,
    host           : 'us-cdbr-east-03.cleardb.com',
    user           : 'bcdc860f7e7a48',
    password       : 'a5e749b2',
    database       : 'heroku_42b48861b2acd53',
    port           : 3306
  } */

};