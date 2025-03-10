import * as path from 'path';
import { Knex } from 'knex';
import dotenv from 'dotenv';
dotenv.config();

const config: { [key: string]: Knex.Config } = {
  development: {
    client: 'pg',
    connection: process.env.DATABASE_URL,
    migrations: {
      directory: './src/db/migrations', 
    },
  },
  production: {
    client: 'pg',
    connection: {
      host: `/cloudsql/${process.env.INSTANCE_CONNECTION_NAME}`,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
    },
    migrations: {
      directory: path.resolve(__dirname, 'migrations'),
    },
    pool: { min: 2, max: 10 },
  },
};

export default config;
