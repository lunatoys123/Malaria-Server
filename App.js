import express from "express";
import bodyParser from "body-parser";
import morgan from "morgan";
import cors from "cors";
import Malaria from "./Model/Malaria.js";
import mongoose from "mongoose";

const patient = Malaria.Patient;

const app = express();
app.use(bodyParser.json());
app.use(morgan("tiny"));
app.use(cors());
app.options("*", cors());

test();
async function test() {
  const newPatient = new patient({
    name: "Lau Kin Tung",
    Identification: "Y530598(3)",
    Contact: [
      {
        Type: "Mobile",
        Phone_number: "11111111",
      },
      {
        Type: "Mobile",
        Phone_number: "2222222",
      },
    ],
    Location: [
      {
        City: "Hong Kong",
        Country: "China",
        Street: "Hung leng village",
        Apartment: "32",
      },
    ],
    Email: "laukintung@gmail.com",
    dtCreatedBy: Date.now(),
    dtUpdatedBy: Date.now(),
    CreateBy: "Admin",
    UpdateBy: "Admin",
  });

  await newPatient.save();
  console.log(newPatient);
}

app.listen(4000, () => {
  console.log("listen to port 4000");
});
