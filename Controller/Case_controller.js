import Malaria from "../Model/Malaria.js";
import { status_code } from "../Common/status_code.js";
import mongoose from "mongoose";

const Patient = Malaria.Patient;
const Case = Malaria.case;
const Laboratory = Malaria.Labortary;
const Treatment = Malaria.Treatment;
const Doctor = Malaria.Doctor;

export const AddCase = async (req, res) => {
  const request = req.body;
  const Patient_data = request.Patient_data;
  const case_data = request.case;

  if (!Patient_data) {
    return res.status(400).send({
      status: status_code.Failed,
      Error: "Patient Data is not establish correctly",
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
      .send({ status: status_code.Failed, Error: err.message });
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
