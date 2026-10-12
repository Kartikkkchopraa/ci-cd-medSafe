import dotenv from 'dotenv'

dotenv.config();

if(!process.env.PORT){
    throw new Error("Port undefined");
}
if(!process.env.FRONTEND_URL){
    throw new Error("FrontEnd Url undefined");
}
if(!process.env.DATABASE_URL){
    throw new Error("Database Url undefined");
}
if(!process.env.JWT_SECRET){
    throw new Error("Jwt secret undefined");
}

const config = {
    PORT: process.env.PORT,
    FRONTEND_URL: process.env.FRONTEND_URL,
    DATABASE_URL: process.env.DATABASE_URL,
    JWT_SECRET: process.env.JWT_SECRET
};


export default config;