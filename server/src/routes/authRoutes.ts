import { Router } from "express";
import * as authController from "../controllers/authController.js"

const authRouter = Router();

authRouter.post("/register", authController.register);
authRouter.post("/login", authController.login);
authRouter.post("/refresh",authController.refresh);
authRouter.post("/logout",authController.logout);
authRouter.post("/logoutAll", authController.logoutAll);

export default authRouter;