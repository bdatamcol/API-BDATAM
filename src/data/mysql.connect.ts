import mysql from 'mysql2/promise';
import { envs } from '../config/envs';

const mysqlConfig = {
    host: envs.mysqlHost,
    database: envs.mysqlDatabase,
    user: envs.mysqlUser,
    password: envs.mysqlPassword,
    port: envs.mysqlPort,
    connectionLimit: 10,
    idleTimeout : 60000,
};

// Pool de conexiones MySQL
const mysqlPool = mysql.createPool(mysqlConfig);

export async function executeMySQLQuery(query: string, params: any[] = []) {
    try {
        const [rows] = await mysqlPool.execute(query, params);
        return rows;
    } catch (error) {
        console.error('Error executing MySQL query:', error);
        throw error;
    }
}

export async function getMySQLConnection() {
    try {
        return await mysqlPool.getConnection();
    } catch (error) {
        console.error('Error getting MySQL connection:', error);
        throw error;
    }
}

export { mysqlPool };