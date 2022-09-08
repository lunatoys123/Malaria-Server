import express from "express";
import * as caseController from "../Controller/Case_controller.js";

const router = express.Router();
router.post("/AddCase", caseController.AddCase);
router.post("/AddLabortary", caseController.addLaboratory);
router.post("/AddTreatment", caseController.addTreatment);
router.get("/view/:doctor_id", caseController.viewReport);

export default router;