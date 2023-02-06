import express from "express";
import * as WHOController from "../Controller/WHO_controller.js";

const router = express.Router();
router.get("/preview", WHOController.Preview);
router.get("/Data", WHOController.WHO_Data);
router.get("/countries", WHOController.GetCountries);
router.get("/CompareData", WHOController.CompareData);

export default router;
