
import pg from "pg";
import config from "./config.js";
import { readFileSync } from "node:fs";

const { Pool } = pg;

const rdsCA = readFileSync(
    new URL("../../certs/global-bundle.pem", import.meta.url)
);

const pool = new Pool({
    connectionString: config.DATABASE_URL_AWS,
    ssl: {
        ca: rdsCA,
        rejectUnauthorized: true
    },
    connectionTimeoutMillis: 10000
});

async function connectDB() {
    try {
        await pool.query("SELECT 1");
        console.log("Database connected successfully");
    } catch (error) {
        console.error("Database connection failed:", error);
        throw error;
    }
}

export default connectDB;
export { pool };
