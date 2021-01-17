const mysql = require("mysql");

const dbConnection = mysql.createPool({
    connectionLimit: process.env.DB_CONNECTION_LIMIT || 10,
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || "salespoint_db",
    multipleStatements: true
});

module.exports = dbConnection;