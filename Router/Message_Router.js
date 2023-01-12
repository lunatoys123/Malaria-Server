import express from "express";
import * as MessageController from "../Controller/Message_Controller.js";

const router = express.Router();
router.post("/Send", MessageController.SendMessageToUser);

export default router;
