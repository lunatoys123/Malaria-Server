import express from "express";
import * as MessageController from "../Controller/Message_Controller.js";

const router = express.Router();
router.post("/Send", MessageController.SendMessageToUser);
router.post("/ReadState", MessageController.SetReadStateForMessage);
router.get("/GetMessageForUser", MessageController.GetMessageForUser);
router.get("/getUnreadCount", MessageController.getUnreadCount);

export default router;
