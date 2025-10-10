import 'dotenv/config';
import { get } from 'env-var';

export const envs = {
    port: get('PORT').default('3000').asPortNumber(),

    dbHost: get('DB_HOST').required().asString(),
    dbName: get('DB_NAME').required().asString(),
    dbUser: get('DB_USER').required().asString(),
    dbPassword: get('DB_PASSWORD').required().asString(),

    hostApi: get('HOST_API').default('http://localhost:3000').asString(),
    jwtSecret: get('JWT_SECRET').required().asString(),
    jwtExpiresIn: get('JWT_EXPIRES_IN').required().asString(),
    apiKey: get('API_KEY').required().asString(),

    // MySQL Configuration for WordPress/WooCommerce
    mysqlHost: get('MYSQL_HOST').required().asString(),
    mysqlDatabase: get('MYSQL_DATABASE').required().asString(),
    mysqlUser: get('MYSQL_USER').required().asString(),
    mysqlPassword: get('MYSQL_PASSWORD').required().asString(),
    mysqlPort: get('MYSQL_PORT').required().asPortNumber(),

    // Documentation settings
    docsPublic: get('DOCS_PUBLIC').default('false').asBool(),
};