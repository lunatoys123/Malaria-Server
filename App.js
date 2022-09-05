import express from "express";
import bodyParser from "body-parser";
import morgan from "morgan";
import cors from "cors";

import HospitalRouter from "./Router/Hospital_Router.js";
import userRouter from "./Router/User_Router.js";
import caseRouter from "./Router/Case_Router.js";

import authJWT from "./helpers/jwt.js";
import errorHandler from "./helpers/ErrorHandler.js";

const app = express();
app.use(bodyParser.json());
app.use(morgan("tiny"));
app.use(cors());
app.options("*", cors());

app.use(authJWT());
app.use(errorHandler);

app.use("/Malaria/Hospital", HospitalRouter);
app.use("/Malaria/User", userRouter);
app.use("/Malaria/Case", caseRouter);

app.listen(4000, () => {
  console.log("listen to port 4000");
});
