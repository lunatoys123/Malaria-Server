import express from "express";
import bodyParser from "body-parser";
import morgan from "morgan";
import cors from "cors";

import HospitalRouter from "./Router/Hospital_Router.js";
import userRouter from "./Router/User_Router.js";
import caseRouter from "./Router/Case_Router.js";
import WHORouter from "./Router/WHO_Router.js";
import PatientRouter from "./Router/Patient_Router.js";
import MessageRouter from "./Router/Message_Router.js";

import authJWT from "./helpers/jwt.js";
import errorHandler from "./helpers/ErrorHandler.js";
import * as dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());
//app.use(bodyParser.json());
app.use(morgan("tiny"));
app.use(cors());
app.options("*", cors());

app.use(authJWT());
app.use(errorHandler);

app.use("/Malaria/Hospital", HospitalRouter);
app.use("/Malaria/User", userRouter);
app.use("/Malaria/Case", caseRouter);
app.use("/Malaria/WHO", WHORouter);
app.use("/Malaria/Patient", PatientRouter);
app.use("/Malaria/Message", MessageRouter);

app.listen(4000, () => {
	console.log("listen to port 4000");
});
