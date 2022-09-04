import Malaria from "../Model/Malaria.js";
import { status_code } from "../Common/status_code.js";
import mongoose from "mongoose";

const Patient = Malaria.Patient;
const Case = Malaria.case;

export const AddCase = async (req, res) => {
  const request = req.body;
  const Patient_data = request.Patient_data;
  const case_data = request.case;

  if (!Patient_data) {
    return res.status(400).send({
      status: status_code.Failed,
      Message: "Patient Data is not establish correctly",
    });
  }

  var newPatient = new Patient({
    name: Patient_data.name,
    Identification: Patient_data.Identification,
    Contact: Patient_data.Contact,
    Location: Patient_data.Location,
    dtCreated: Date.now(),
    dtUpdated: Date.now(),
    Gender: Patient_data.Gender,
    Date_of_Birth: Date.now(),
  });

  newPatient = await newPatient.save().catch((err) => {
    return res
      .status(400)
      .send({ status: status_code.Failed, Message: err.message });
  });

  const Patient_id = newPatient._id;

  var newCase = new Case({
    Patient_id: Patient_id,
    Doctor_id: mongoose.Types.ObjectId(case_data.Doctor_id),
    Symptoms: case_data.Symptoms,
    Clinical_Complication: case_data.Clinical_Complication,
    Hospitalized: case_data.Hospitalized,
    Emergency: case_data.Emergency,
    blood_transfusion: case_data.blood_transfusion,
  });

  await newCase
    .save()
    .then((data) => {
      return res
        .status(200)
        .send({ status: status_code.Success, Message: "Case establish" });
    })
    .catch((err) => {
      return res
        .status(400)
        .send({ status: status_code.Failed, error: err.message });
    });
};

export const addLaboratory = async (req, res) => {
  
};
