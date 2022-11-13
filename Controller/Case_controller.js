import Malaria from "../Model/Malaria.js";
import { status_code } from "../Common/status_code.js";
import mongoose from "mongoose";
import { request } from "express";

const Patient = Malaria.Patient;
const Case = Malaria.case;
const Laboratory = Malaria.Labortary;
const Treatment = Malaria.Treatment;
const Doctor = Malaria.Doctor;

export const AddCase = async (req, res) => {
  const request = req.body;
  var Patient_data = request.Patient_data;
  var case_data = request.case;
  const user = request.user;

  // console.log(user);

  if (!Patient_data) {
    return res.status(400).send({
      status: status_code.Failed,
      Error: "Patient Data is not establish correctly",
    });
  }

  Patient_data = {...Patient_data, CreateBy: user.login_name, UpdateBy: user.login_name}

  var newPatient = new Patient(Patient_data);

  newPatient = await newPatient.save().catch((err) => {
    return res
      .status(400)
      .send({ status: status_code.Failed, Error: err.message });
  });

  const Patient_id = newPatient._id;

  case_data = {...case_data, Patient_id: mongoose.Types.ObjectId(Patient_id), Doctor_id: mongoose.Types.ObjectId(user.Doctor_id)}

  var newCase = new Case(case_data);

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
        .send({ status: status_code.Failed, Error: err.message });
    });
};

export const addLaboratory = async (req, res) => {
  const request = req.body;
  const case_id = request.case_id;
  const Blood_Smear = request.Blood_Smear;
  const PCR_of_Blood = request.PCR_of_Blood;
  const RDT = request.RDT;

  if (!mongoose.Types.ObjectId.isValid(case_id)) {
    return res.status(404).send({ status: status_code.Failed, Error: "case id format is not valid" });
  }

  const case_id_exist = await Case.findOne({ _id: case_id });
  if (!case_id_exist) {
    return res.status(404).send({ status: status_code.Failed, Error: "case id does not exist" });
  }

  var newLaboratory = new Laboratory({
    case_id: mongoose.Types.ObjectId(case_id),
    Blood_Smear,
    PCR_of_Blood,
    RDT,
  });

  await newLaboratory
    .save()
    .then((data) => {
      return res.status(200).send({
        status: status_code.Success,
        Message: "Labortary record establish",
      });
    })
    .catch((err) => {
      return res
        .status(404)
        .send({ status: status_code.Failed, Error: err.message });
    });
};

export const addTreatment = async (req, res) => {
  const request = req.body;
  const case_id = request.case_id;
  const Threapy = request.Threapy;
  const Received = request.Received;
  const Chemoprophylaxis_taken = request.Chemoprophylaxis_taken;
  const Drug_taken = request.Drug_taken;
  const pills_taken = request.pills_taken;
  const missed_dose_reason = request.missed_dose_reason;
  const Side_Effect = request.Side_Effect;

  if (!mongoose.Types.ObjectId.isValid(case_id)) {
    return res.status(404).send({ status: status_code.Failed, Error: "case id format is not valid" });
  }

  const newTreatment = new Treatment({
    case_id: mongoose.Types.ObjectId(case_id),
    Threapy,
    Received,
    Chemoprophylaxis_taken,
    Drug_taken,
    pills_taken,
    missed_dose_reason,
    Side_Effect,
    dtCreated: Date.now(),
    dtUpdated: Date.now()
  });

  const case_id_exist = await Case.findOne({ _id: case_id });

  if (!case_id_exist) {
    return res.status(404).send({ status: status_code.Failed, Error: "case id does not exist" });
  }

  await newTreatment
    .save()
    .then((data) => {
      return res
        .status(200)
        .send({ status: status_code.Success, Message: "Treatment establish" });
    })
    .catch((err) => {
      return res
        .status(404)
        .send({ status: status_code.Failed, Error: err.message });
    });
};

export const viewReport = async (req, res) => {
  var doctor_id = req.params.doctor_id;

  if (mongoose.Types.ObjectId.isValid(doctor_id)) {
    doctor_id = mongoose.Types.ObjectId(doctor_id);
  } else {
    return res.status(404).send({ status: status_code.Failed, Error: "Doctor id format is not valid" });
  }

  const exist_doctor_id = await Doctor.findOne({ _id: doctor_id }, {});
  if (!exist_doctor_id) {
    return res.status(400).send({ status: status_code.Failed, Error: "Doctor id not exists" });
  }

  var dataObject = await Case.aggregate([
    {
      $match: {
        Doctor_id: doctor_id
      }
    },
    {
      $lookup: {
        from: 'Laboratory',
        localField: '_id',
        foreignField: 'case_id',
        as: 'Laboratory'
      }
    },
    {
      $lookup: {
        from: 'Treatment',
        localField: 'string',
        foreignField: 'string',
        as: 'Treatment'
      }
    },
    {
      $lookup: {
        from: 'Patient',
        localField: 'Patient_id',
        foreignField: '_id',
        as: 'Patient'
      }
    },
    {
      $unwind: {
        path: '$Patient'
      }
    },
    {
      $project: {
        _id: 0,
        Patient: 1,
        Treatment: 1,
        Laboratory: 1,
        Hospitalized: 1,
        "case_status.Emergency": '$Emergency',
        "case_status.blood_transfusion": "$blood_transfusion",
        "case_status.Hospitalized": '$Hospitalized',
        "case_status.Symptoms": '$Symptoms',
        "case_status.Clinical_Complication": '$Clinical_Complication'
      }
    }
  ]);

  return res.status(200).send(dataObject);
}

export const getCaseByDoctorId = async(req, res)=>{
  const Doctor_id = req.query.Doctor_id

  const case_object = await Case.aggregate([
    {
      $match:{
        Doctor_id: mongoose.Types.ObjectId(Doctor_id)
      }
    },
    {
      $lookup:{
        from: "Patient",
        localField: "Patient_id",
        foreignField: "_id",
        as: "Patient"
      }
    },
    {
      $unwind:{
        path:"$Patient"
      }
    },
    {
      $project:{
        Patient_Name: "$Patient.Name",
        Patient_Status:1,
        Status_date:1,
        Report_Status: 1,
        Patient_id: 1
      }
    }
  ])


  return res.status(200).send(case_object);
}

export const getCaseByCaseId = async(req, res) =>{
  const case_id = req.query.case_id;
  //console.log(case_id);
  const case_Object = await Case.findOne(
    {_id: case_id}, 
    {Symptoms:1, Hospitalization: 1, Travel_History: 1, Clinical_Complications: 1, Previous_Diagnosis_Malaria: 1, Patient_Status:1, Report_Status: 1, Status_date: 1});
  
  return res.status(200).send(case_Object);
}
