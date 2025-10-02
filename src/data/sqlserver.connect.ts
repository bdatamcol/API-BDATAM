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
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000,
    },
    requestTimeout: 300000,
    connectionTimeout: 60000,
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

// Función para ejecutar consultas en una base de datos específica
export async function executeQuery(query: string, params: any[] = [], database?: string) {
    let pool;
    try {
        if (database) {
            // Crear configuración específica para la base de datos
            const specificDbConfig = {
                ...dbConfig,
                database: database
            };
            pool = await sql.connect(specificDbConfig);
        } else {
            pool = await getPool();
        }

        const request = pool.request();

        // Agregar parámetros si existen
        params.forEach((param, index) => {
            request.input(`param${index}`, param);
        });

        const result = await request.query(query);
        return result;
    } catch (error) {
        console.error('Error executing query:', error);
        throw error;
    } finally {
        if (pool && database) {
            // Cerrar la conexión específica si se creó una nueva
            await pool.close();
        }
    }
}