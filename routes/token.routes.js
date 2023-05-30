import { Router } from "express";
import { saveToken, getToken, updateToken } from "../controllers/token.controllers.js";
import isLoggedIn from "../middlewares/isLoggedIn.js"

const tokenRouter = Router();
tokenRouter.use(isLoggedIn)

tokenRouter
.get("/getToken", isLoggedIn, getToken)
.post("/saveToken", isLoggedIn, saveToken)
.post("/updateToken", isLoggedIn, updateToken)

export default tokenRouter;