import { login, signup } from "../controllers/auth.controller.js";
import { Router } from "express"

const authRouter = Router();

authRouter.post("/login", login);
authRouter.post("/signup", signup);

export default authRouter;