import express from "express";
import bodyParser from "body-parser";
import morgan from "morgan";
import cors from "cors";
import Malaria from "./Model/Malaria.js";
import mongoose from "mongoose";

const Case = Malaria.case

const app = express();
app.use(bodyParser.json());
app.use(morgan("tiny"));
app.use(cors());
app.options("*", cors());

test();
async function test() {
}

app.listen(4000, () => {
  console.log("listen to port 4000");
});
