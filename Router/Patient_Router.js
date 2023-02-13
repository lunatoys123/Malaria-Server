import express from "express";
import * as PatientController from "../Controller/PatientController.js";

const router = express.Router();
router.get("/getPatientList", PatientController.getPatientList);
router.get("/getPatientById", PatientController.getPatientById);
router.get("/searchPatientWithQuery", PatientController.searchPatientWithQuery);
router.post("/editPersonalInformationById", PatientController.editPersonalInformationById);

export default router;