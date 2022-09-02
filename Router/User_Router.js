import express from "express";
import * as userController from "../Controller/user_controller.js"

const router = express.Router();
router.post('/register', userController.Register);
router.post('/login', userController.Login);
router.get("/all", userController.GetAllUser);

export default router;