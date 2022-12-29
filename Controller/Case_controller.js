import Malaria from "../Model/Malaria.js";
import { status_code } from "../Common/status_code.js";
import mongoose from "mongoose";
import { request } from "express";
import { expressjwt } from "express-jwt";

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

	Patient_data = {
		...Patient_data,
		CreateBy: user.login_name,
		UpdateBy: user.login_name,
	};

	var newPatient = new Patient(Patient_data);

	newPatient = await newPatient.save().catch((err) => {
		return res.status(400).send({ status: status_code.Failed, Error: err.message });
	});

	const Patient_id = newPatient._id;

	case_data = {
		...case_data,
		Patient_id: mongoose.Types.ObjectId(Patient_id),
		Doctor_id: mongoose.Types.ObjectId(user.Doctor_id),
	};

	var newCase = new Case(case_data);

	await newCase
		.save()
		.then((data) => {
			return res.status(200).send({ status: status_code.Success, Message: "Case establish" });
		})
		.catch((err) => {
			return res.status(400).send({ status: status_code.Failed, Error: err.message });
		});
};

export const addLaboratory = async (req, res) => {
	const request = req.body;
	const case_id = request.case_id;
	const Blood_Smear = request.Laboratory.Blood_Smear;
	const PCR_of_Blood = request.Laboratory.PCR_of_Blood;
	const RDT = request.Laboratory.RDT;

	if (!mongoose.Types.ObjectId.isValid(case_id)) {
	  return res.status(404).send({
	    status: status_code.Failed,
	    Error: "case id format is not valid",
	  });
	}

	const case_id_exist = await Case.findOne({ _id: case_id });
	if (!case_id_exist) {
	  return res
	    .status(404)
	    .send({ status: status_code.Failed, Error: "case id does not exist" });
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
	      Message: "Laboratory record establish",
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
	const Treatment_info = request.Treatment;

	const case_id = Treatment_info.case_id;
	const Therapy = Treatment_info.Therapy;
	const Received = Treatment_info.Received;
	const Chemoprophylaxis_taken = Treatment_info.Chemoprophylaxis_taken;
	const Drug_taken = Treatment_info.Drug_taken;
	const Drug_taken_Other = Treatment_info.Drug_taken_Other;
	const pills_taken = Treatment_info.pills_taken;
	const pills_taken_Other = Treatment_info.pills_taken_Other;
	const missed_dose_reason = Treatment_info.missed_dose_reason;
	const Side_Effect = Treatment_info.Side_Effect;

	if (!mongoose.Types.ObjectId.isValid(case_id)) {
		return res.status(404).send({
			status: status_code.Failed,
			Error: "case id format is not valid",
		});
	}

	const newTreatment = new Treatment({
		case_id: mongoose.Types.ObjectId(case_id),
		Therapy,
		Received,
		Chemoprophylaxis_taken,
		Drug_taken,
		Drug_taken_Other,
		pills_taken,
		pills_taken_Other,
		missed_dose_reason,
		Side_Effect,
		dtCreated: Date.now(),
		dtUpdated: Date.now(),
	});

	const case_id_exist = await Case.findOne({ _id: case_id });

	if (!case_id_exist) {
		return res.status(404).send({ status: status_code.Failed, Error: "case id does not exist" });
	}

	await newTreatment
		.save()
		.then((data) => {
			return res.status(200).send({ status: status_code.Success, Message: "Treatment establish" });
		})
		.catch((err) => {
			return res.status(404).send({ status: status_code.Failed, Error: err.message });
		});
};

export const viewReport = async (req, res) => {
	var doctor_id = req.params.doctor_id;

	if (mongoose.Types.ObjectId.isValid(doctor_id)) {
		doctor_id = mongoose.Types.ObjectId(doctor_id);
	} else {
		return res.status(404).send({
			status: status_code.Failed,
			Error: "Doctor id format is not valid",
		});
	}

	const exist_doctor_id = await Doctor.findOne({ _id: doctor_id }, {});
	if (!exist_doctor_id) {
		return res.status(400).send({ status: status_code.Failed, Error: "Doctor id not exists" });
	}

	var dataObject = await Case.aggregate([
		{
			$match: {
				Doctor_id: doctor_id,
			},
		},
		{
			$lookup: {
				from: "Laboratory",
				localField: "_id",
				foreignField: "case_id",
				as: "Laboratory",
			},
		},
		{
			$lookup: {
				from: "Treatment",
				localField: "string",
				foreignField: "string",
				as: "Treatment",
			},
		},
		{
			$lookup: {
				from: "Patient",
				localField: "Patient_id",
				foreignField: "_id",
				as: "Patient",
			},
		},
		{
			$unwind: {
				path: "$Patient",
			},
		},
		{
			$project: {
				_id: 0,
				Patient: 1,
				Treatment: 1,
				Laboratory: 1,
				Hospitalized: 1,
				"case_status.Emergency": "$Emergency",
				"case_status.blood_transfusion": "$blood_transfusion",
				"case_status.Hospitalized": "$Hospitalized",
				"case_status.Symptoms": "$Symptoms",
				"case_status.Clinical_Complication": "$Clinical_Complication",
			},
		},
	]);

	return res.status(200).send(dataObject);
};

export const getCaseByDoctorId = async (req, res) => {
	const Doctor_id = req.query.Doctor_id;

	const case_object = await Case.aggregate([
		{
			$match: {
				Doctor_id: mongoose.Types.ObjectId(Doctor_id),
			},
		},
		{
			$lookup: {
				from: "Patient",
				localField: "Patient_id",
				foreignField: "_id",
				as: "Patient",
			},
		},
		{
			$lookup: {
				from: "Treatment",
				localField: "_id",
				foreignField: "case_id",
				as: "Treatment",
			},
		},
		{
			$unwind: {
				path: "$Patient",
			},
		},
		{
			$project: {
				Patient_Name: "$Patient.Name",
				Patient_Status: 1,
				Status_date: 1,
				Report_Status: 1,
				Patient_id: 1,
				haveTreatment: {
					$cond: {
						if: { $gt: [{ $size: "$Treatment" }, 0] },
						then: true,
						else: false,
					},
				},
			},
		},
	]);

	return res.status(200).send(case_object);
};

export const getCaseByCaseId = async (req, res) => {
	const case_id = req.query.case_id;
	//console.log(case_id);
	const case_Object = await Case.findOne(
		{ _id: case_id },
		{
			Symptoms: 1,
			Hospitalization: 1,
			Travel_History: 1,
			Clinical_Complications: 1,
			Previous_Diagnosis_Malaria: 1,
			Patient_Status: 1,
			Report_Status: 1,
			Status_date: 1,
		}
	);

	return res.status(200).send(case_Object);
};

export const getTreatmentByCaseId = async (req, res) => {
	const case_id = req.query.case_id;

	const Treatment_Object = await Treatment.findOne(
		{ case_id: case_id },
		{
			Received: 1,
			Drug_taken: 1,
			Drug_taken_Other: 1,
			pills_taken: 1,
			pills_taken_Other: 1,
			missed_dose_reason: 1,
			Side_Effect: 1,
			Therapy: 1,
			Chemoprophylaxis_taken: 1,
		}
	);

	return res.status(200).send(Treatment_Object);
};

export const updateReportById = async (req, res) => {
	const case_id = req.body.case_id;
	const report_data = req.body.report_data;

	const Case_data = report_data.case;

	if (!Case_data) {
		return res.status(400).send({
			status: status_code.Failed,
			Error: "report data is not establish correctly",
		});
	}

	if (!mongoose.Types.ObjectId.isValid(case_id)) {
		return res.status(404).send({
			status: status_code.Failed,
			Error: "case id format is not valid",
		});
	}

	await Case.findOneAndUpdate({ _id: case_id }, Case_data, { new: true })
		.then((data) => {
			return res.status(200).send({
				status: status_code.Success,
				Message: "Report Updated Successfully",
			});
		})
		.catch((err) => {
			return res.status(404).send({ status: status_code.Failed, Error: err });
		});
};

export const updateTreatmentByCaseId = async (req, res) => {
	const id = req.body.id;
	const Treatment_info = req.body.Treatment;

	if (!mongoose.Types.ObjectId.isValid(id)) {
		return res.status(404).send({
			status: status_code.Failed,
			Error: "Treatment id format is not valid",
		});
	}

	if (!Treatment_info) {
		return res.status(400).send({
			status: status_code.Failed,
			Error: "Treatment information is not establish correctly",
		});
	}

	await Treatment.findOneAndUpdate({ _id: id }, Treatment_info, {
		new: true,
	})
		.then((data) => {
			return res.status(200).send({ status: status_code.Success, Message: "Treatment updated" });
		})
		.catch((err) => {
			return res.status(404).send({ status: status_code.Failed, Error: err });
		});
};
