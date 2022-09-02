import express from "express";
import bodyParser from "body-parser";
import morgan from "morgan";
import cors from "cors";
import HospitalRouter from "./Router/Hospital_Router.js";

const app = express();
app.use(bodyParser.json());
app.use(morgan("tiny"));
app.use(cors());
app.options("*", cors());

app.use("/Malaria/Hospital", HospitalRouter);

app.listen(4000, () => {
  console.log("listen to port 4000");
});
