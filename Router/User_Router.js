import express from "express";
import * as userController from "../Controller/user_controller.js";
import { checkAdminRight } from "../helpers/middlewares.js";

const router = express.Router();
router.post("/register", checkAdminRight, userController.Register);
router.post("/login", userController.Login);
router.post("/ResetPassword", userController.ResetPassword);
router.get("/all", userController.GetAllUser);
router.get(
	"/GetNormalUsersFromHospital",
	checkAdminRight,
	userController.GetNormalUsersFromHospital
);
router.get("/GetAllUserFromHospital", userController.GetAllUserFromHospital);

export default router;
