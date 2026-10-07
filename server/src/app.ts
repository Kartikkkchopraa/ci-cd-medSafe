import express from "express";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser"

import config from "./config/config.js"

const app = express();

app.use(cors({
    origin: config.FRONTEND_URL,
    credentials: true
}))

app.use(morgan("dev"));
app.use(cookieParser());

export default app;



