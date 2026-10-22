import express from "express";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser"
import config from "./config/config.js"
import authRouter from "./routes/authRoutes.js"
import aiRouter from "./routes/aiRoutes.js";

const app = express();
app.use(express.json());
app.use(cors({
    origin: config.FRONTEND_URL,
    credentials: true
}))

app.use(morgan("dev"));
app.use(cookieParser());

app.use("/api/auth", authRouter);
app.use("/api", aiRouter);

export default app;



