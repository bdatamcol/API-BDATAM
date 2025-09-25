const sql = require('mssql');

import { envs } from '../config/envs';


const dbConfig = {
    user: envs.dbUser,
    password: envs.dbPassword,
    server: envs.dbHost,
    database: envs.dbName,
    options: {
        encrypt: false,
        trustServerCertificate: true,
    },
};


export async function getPool() {
    try {
        const pool = await sql.connect(dbConfig);
        return pool;
    } catch (error) {
        console.error('Error getting database pool:', error);
        throw error;
    }
}