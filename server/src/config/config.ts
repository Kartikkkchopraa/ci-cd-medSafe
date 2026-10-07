import dotenv from 'dotenv'

dotenv.config();

if(!process.env.PORT){
    throw new Error("Port undefined");
}
if(!process.env.FRONTEND_URL){
    throw new Error("FrontEnd Url undefined");
}

const config = {
    PORT: process.env.PORT,
    FRONTEND_URL: process.env.FRONTEND_URL,
};


export default config;