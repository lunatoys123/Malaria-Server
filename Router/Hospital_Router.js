import express from "express";
import * as HospitalController from "../Controller/Hospital_controller.js";

const router = express.Router();
router.post("/Register", HospitalController.RegisterHosptial);
router.get("/Regions", HospitalController.findAllRegion);

export default router;
