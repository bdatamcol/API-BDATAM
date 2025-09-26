import 'dotenv/config';
import { get } from 'env-var';

export const envs = {
    port: get('PORT').default('3000').asPortNumber(),
    dbHost: get('DB_HOST').required().asString(),
    dbName: get('DB_NAME').required().asString(),
    dbUser: get('DB_USER').required().asString(),
    dbPassword: get('DB_PASSWORD').required().asString(),
    hostApi: get('HOST_API').default('http://localhost:3000').asString(),
};