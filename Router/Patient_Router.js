import express from "express";
import * as PatientController from "../Controller/PatientController.js"

const router = express.Router();
router.get('/getPatientList' ,PatientController.getPatientList)


export default router;