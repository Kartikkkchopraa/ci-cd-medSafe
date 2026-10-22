import { Router } from "express";
import * as aiController from "../controllers/aiController.js"
import authenticateAccessToken from "../middleware/authenticateAccessToken.js";

const aiRouter = Router();

aiRouter.post("/aiResult",aiController.getAiResult)

export default aiRouter;