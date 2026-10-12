import pg from "pg";
import config from "./config.js"

const {Pool} = pg;

const pool = new Pool({
    connectionString: config.DATABASE_URL
});

async function connectDB(){
    try{
        await pool.query("select 1");
        console.log("database connected");
    } catch(error){
        console.log("Issue while connecting to database: ", error);
    }
}


export default connectDB;
export {pool};

