import { addChannel, getChannels, editChannel, deleteChannel, getKeywords, deleteKeyword, addKeywords, getPings, addPing, deletePing } from "../controllers/actions.controllers.js";
import { Router } from "express";
import isLoggedIn from "../middlewares/isLoggedIn.js"
import { initializeBot } from "../controllers/discordBot.controller.js"

const actionsRouter = Router();
actionsRouter.use(isLoggedIn)

actionsRouter
.get("/channels", isLoggedIn, getChannels)
.get("/getKeywords", isLoggedIn, getKeywords)
.get('/startBot', isLoggedIn, initializeBot)
.post("/addKeywords", isLoggedIn, addKeywords)
.post("/addChannel", isLoggedIn, addChannel)
.post("/editChannel", isLoggedIn, editChannel)
.post("/deleteChannel", isLoggedIn, deleteChannel)
.post("/deleteKeyword", isLoggedIn, deleteKeyword)
// pings
.get("/getPing", isLoggedIn, getPings)
.post("/addPing", isLoggedIn, addPing)
.post("/deletePing", isLoggedIn, deletePing)
export default actionsRouter;