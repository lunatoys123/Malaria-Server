import express from "express";
import * as userController from "../Controller/user_controller.js";
import { checkAdminRight } from "../helpers/middlewares.js";

const router = express.Router();
router.post("/register", checkAdminRight, userController.Register);
router.post("/login", userController.Login);
//For New User First Login
router.post("/ResetPassword", userController.ResetPassword);
//For Exists User that forget Password
router.post("/ForgetPasswordProcess", userController.ForgetordProcess);
router.post("/Recovery_Authentication", userController.RecoveryAuthentication);
router.post("/deleteUser", userController.deleteUser);
router.post("/recoverUser", userController.recoverUser);
router.get("/all", userController.GetAllUser);
router.get(
	"/GetNormalUsersFromHospital",
	checkAdminRight,
	userController.GetNormalUsersFromHospital
);
router.get("/GetAllUserFromHospital", userController.GetAllUserFromHospital);
router.get("/GetAuditFromDoctorId", checkAdminRight, userController.GetAuditFromDoctorId);
router.get("/SearchQueryForUser", checkAdminRight, userController.SearchQueryForUser);
router.get("/HospitalSummaryData", checkAdminRight, userController.HospitalSummaryData);
router.get("/TreatmentSummaryData", userController.TreatmentSummaryData);

export default router;
