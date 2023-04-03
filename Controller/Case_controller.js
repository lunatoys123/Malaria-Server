import Malaria from "../Model/Malaria.js";
import { status_code, Operation_Mode } from "../Common/status_code.js";
import mongoose from "mongoose";

const Patient = Malaria.Patient;
const Case = Malaria.case;
const Laboratory = Malaria.Labortary;
const Treatment = Malaria.Treatment;
const Doctor = Malaria.Doctor;
const Audit = Malaria.Audit;

export const AddCase = async (req, res) => {
	const request = req.body;
	var Patient_data = request.Patient_data;
	var case_data = request.case;
	const user = request.user;
	const mode = request.mode;

	if (mode == Operation_Mode.create) {
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

		newPatient = await newPatient.save().catch(err => {
			return res.status(400).send({ status: status_code.Failed, Error: err.message });
		});

		const Patient_id = newPatient._id;

		if (!case_data) {
			return res.status(400).send({
				status: status_code.Failed,
				Error: "Case Data is not establish correctly",
			});
		}

		case_data = {
			...case_data,
			Patient_id: mongoose.Types.ObjectId(Patient_id),
			Doctor_id: mongoose.Types.ObjectId(user.Doctor_id),
		};

		var newCase = new Case(case_data);

		const case_Object = await newCase.save().catch(err => {
			return res.status(400).send({ status: status_code.Failed, Error: err.message });
		});

		if (case_Object) {
			const newAudit = new Audit({
				Doctor_id: mongoose.Types.ObjectId(user.Doctor_id),
				Activity: `Add Malaria Reports: ${Patient_id}`,
				Audit_Code: "Malaria_Report_Add",
			});

			await newAudit.save().catch(err => {
				console.log(err);
			});
			return res.status(200).send({ status: status_code.Success, Message: "Case establish" });
		}
	} else if (mode === Operation_Mode.createWithPatientId) {
		if (!case_data) {
			return res.status(400).send({
				status: status_code.Failed,
				Error: "Case Data is not establish correctly",
			});
		}

		case_data = {
			...case_data,
			Patient_id: mongoose.Types.ObjectId(case_data.Patient_id),
			Doctor_id: mongoose.Types.ObjectId(user.Doctor_id),
		};

		var newCase = new Case(case_data);

		const case_object = await newCase.save().catch(err => {
			return res.status(400).send({ status: status_code.Failed, Error: err.message });
		});

		if (case_object) {
			const newAudit = new Audit({
				Doctor_id: mongoose.Types.ObjectId(user.Doctor_id),
				Activity: `Add Malaria Reports: ${case_data.Patient_id}`,
				Audit_Code: "Malaria_Report_Created",
			});

			await newAudit.save().catch(err => {
				console.log(err);
			});

			return res.status(200).send({ status: status_code.Success, Message: "Case establish" });
		}
	}
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

	const case_Object = await Case.findOne({ _id: case_id }, { Doctor_id: 1, _id: 0 });
	if (!case_Object) {
		return res.status(404).send({ status: status_code.Failed, Error: "case id does not exist" });
	}

	var newLaboratory = new Laboratory({
		case_id: mongoose.Types.ObjectId(case_id),
		Blood_Smear,
		PCR_of_Blood,
		RDT,
	});

	const Laboratory_Object = await newLaboratory.save().catch(err => {
		return res.status(404).send({ status: status_code.Failed, Error: err.message });
	});

	if (Laboratory_Object) {
		const newAudit = new Audit({
			Doctor_id: case_Object.Doctor_id,
			Activity: `Add Laboratory on Case: ${case_id}`,
			Audit_Code: "Malaria_Laboratory_Created",
		});
		await newAudit.save().catch(err => {
			console.log(err);
		});

		return res.status(200).send({
			status: status_code.Success,
			Message: "Laboratory record establish",
		});
	}
};

export const addTreatment = async (req, res) => {
	const request = req.body;
	const Treatment_info = request.Treatment;

	const case_id = Treatment_info.case_id;
	const Therapy = Treatment_info.Therapy;
	const Therapy_Other = Treatment_info.Therapy_Other;
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
		Therapy_Other,
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

	const case_Object = await Case.findOne({ _id: case_id }, { Doctor_id: 1, _id: 0 });

	if (!case_Object) {
		return res.status(404).send({ status: status_code.Failed, Error: "case id does not exist" });
	}

	const Treatment_Object = await newTreatment.save().catch(err => {
		return res.status(404).send({ status: status_code.Failed, Error: err.message });
	});

	if (Treatment_Object) {
		const newAudit = new Audit({
			Doctor_id: case_Object.Doctor_id,
			Activity: `Treatment Report created for Case: ${case_id}`,
			Audit_Code: "Malaria_Treatment_Created",
		});
		await newAudit.save().catch(err => {
			console.log(err);
		});
		return res.status(200).send({ status: status_code.Success, Message: "Treatment establish" });
	}
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
				localField: "_id",
				foreignField: "case_id",
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
	console.log(dataObject);
	return res.status(200).send(dataObject);
};

export const viewReportByCaseId = async (req, res) => {
	var id = req.params.id;

	if (mongoose.Types.ObjectId.isValid(id)) {
		id = mongoose.Types.ObjectId(id);
	} else {
		return res.status(404).send({
			status: status_code.Failed,
			Error: "Doctor id format is not valid",
		});
	}

	const exists_case_id = await Case.findOne({ _id: id }, {});
	if (!exists_case_id) {
		return res.status(404).send({
			status: status_code.Failed,
			Error: "Case id does not exist",
		});
	}

	var dataObject = await Case.aggregate([
		{
			$match: {
				_id: id,
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
				localField: "_id",
				foreignField: "case_id",
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
			$lookup: {
				from: "Doctor",
				localField: "Doctor_id",
				foreignField: "_id",
				as: "Doctor",
			},
		},
		{
			$project: {
				Patient: {
					$first: "$Patient",
				},
				Treatment: {
					$first: "$Treatment",
				},
				Laboratory: {
					$first: "$Laboratory",
				},
				Doctor: {
					$first: "$Doctor.Login_name",
				},
				Hospitalization: 1,
				Symptoms: 1,
				Clinical_Complications: 1,
				Previous_Diagnosis_Malaria: 1,
				Patient_Status: 1,
				Report_Status: 1,
				Status_date: 1,
			},
		},
	]);

	dataObject = dataObject[0];
	//console.log(dataObject);
	return res.status(200).send(dataObject);
};

export const getCaseByDoctorId = async (req, res) => {
	const Doctor_id = req.query.Doctor_id;
	const Page = Number(req.query.Page);
	const limit = Number(req.query.limit);

	var Max_count = await Case.aggregate([
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
	]).count("Patient");

	Max_count = Max_count[0].Patient;

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
			$lookup: {
				from: "Laboratory",
				localField: "_id",
				foreignField: "case_id",
				as: "Laboratory",
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
				haveLaboratory: {
					$cond: {
						if: { $gt: [{ $size: "$Laboratory" }, 0] },
						then: true,
						else: false,
					},
				},
			},
		},
		{
			$sort: {
				Patient_Name: 1,
			},
		},
		{
			$skip: (Page - 1) * limit,
		},
		{
			$limit: limit,
		},
	]);

	const Max_Page = Math.floor(Max_count / limit) + 1;
	return res
		.status(200)
		.send({ case_object: case_object, Page: Page, limit: limit, Max_Page: Max_Page });
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
			Therapy_Other: 1,
			Chemoprophylaxis_taken: 1,
		}
	);

	return res.status(200).send(Treatment_Object);
};

export const getLaboratoryByCaseId = async (req, res) => {
	const case_id = req.query.case_id;

	const Laboratory_Object = await Laboratory.findOne(
		{ case_id: case_id },
		{
			Blood_Smear: 1,
			PCR_of_Blood: 1,
			RDT: 1,
		}
	);

	return res.status(200).send(Laboratory_Object);
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

	const Case_Object = await Case.findOneAndUpdate({ _id: case_id }, Case_data, { new: true }).catch(
		err => {
			return res.status(404).send({ status: status_code.Failed, Error: err });
		}
	);
	if (Case_Object) {
		const newAudit = new Audit({
			Doctor_id: Case_Object.Doctor_id,
			Activity: `Update Case Report : ${case_id}`,
			Audit_Code: "Malaria_Case_Update",
		});
		await newAudit.save().catch(err => {
			console.log(err);
		});
		return res.status(200).send({
			status: status_code.Success,
			Message: "Report Updated Successfully",
		});
	}
};

export const updateTreatmentByCaseId = async (req, res) => {
	const id = req.body.id;
	const Treatment_info = req.body.Treatment;

	//console.log(id);

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

	const Treatment_Object = await Treatment.findOneAndUpdate({ _id: id }, Treatment_info, {
		new: true,
	}).catch(err => {
		return res.status(404).send({ status: status_code.Failed, Error: err });
	});

	if (Treatment_Object) {
		const case_id = Treatment_Object.case_id;

		const case_Object = await Case.findOne({ case_id: case_id }, { Doctor_id: 1, _id: 0 });

		const newAudit = new Audit({
			Doctor_id: case_Object.Doctor_id,
			Activity: `Updated Treatment Report on Case: ${id}`,
			Audit_Code: "Malaria_Treatment_Update",
		});

		await newAudit.save().catch(err => {
			console.log(err);
		});
		return res.status(200).send({ status: status_code.Success, Message: "Treatment updated" });
	}
};

export const updateLaboratoryByCaseId = async (req, res) => {
	const id = req.body.id;
	const Laboratory_info = req.body.Laboratory;

	if (!mongoose.Types.ObjectId.isValid(id)) {
		return res.status(404).send({
			status: status_code.Failed,
			Error: "Laboratory id format is not valid",
		});
	}

	if (!Laboratory_info) {
		return res.status(400).send({
			status: status_code.Failed,
			Error: "Laboratory information is not establish correctly",
		});
	}

	const case_Object = await Case.findOne({ case_id: id }, { Doctor_id: 1, _id: 0 });

	const Laboratory_Object = await Laboratory.findOneAndUpdate({ _id: id }, Laboratory_info, {
		new: true,
	}).catch(err => {
		return res.status(404).send({ status: status_code.Failed, Error: err });
	});

	if (Laboratory_Object) {
		const newAudit = new Audit({
			Doctor_id: case_Object.Doctor_id,
			Activity: `Updated Laboratory Report on Case: ${id}`,
			Audit_Code: "Malaria_Laboratory_Update",
		});

		await newAudit.save().catch(err => {
			console.log(err);
		});
		return res.status(200).send({ status: status_code.Success, Message: "Laboratory updated" });
	}
};

export const SearchCasewithQuery = async (req, res) => {
	const query = req.query;
	const Doctor_id = query.Doctor_id;
	const PatientName = query.PatientName;
	const ReportStatus = query.ReportStatus;
	const searchStatus = query.searchStatus;
	const searchStartDate = query.searchStartDate;
	const searchEndDate = query.searchEndDate;
	const Page = Number(query.Page);
	const limit = Number(query.limit);
	//console.log(query);


	if (!mongoose.Types.ObjectId.isValid(Doctor_id)) {
		return res.status(404).send({
			status: status_code.Failed,
			Error: "Doctor id format is not valid",
		});
	}

	let match_query = {
		Doctor_id: mongoose.Types.ObjectId(Doctor_id),
		Patient_Status: { $regex: searchStatus },
		Report_Status: { $regex: ReportStatus },
	};

	if (searchStartDate != null && searchEndDate != null) {
		match_query = {
			...match_query,
			dtCreated: {
				$gte: new Date(searchStartDate),
				$lte: new Date(searchEndDate),
			},
		};
	} else if (searchStartDate != null) {
		match_query = {
			...match_query,
			dtCreated: { $gte: new Date(searchStartDate) },
		};
	} else if (searchEndDate != null) {
		match_query = {
			...match_query,
			dtCreated: { $lte: new Date(searchEndDate) },
		};
	}

	var Patient_count = await Case.aggregate([
		{
			$match: match_query,
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
			$match: {
				"Patient.Name": { $regex: PatientName, $options: "i" },
			},
		},
	]);

	const search_Object = await Case.aggregate([
		{
			$match: match_query,
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
			$lookup: {
				from: "Laboratory",
				localField: "_id",
				foreignField: "case_id",
				as: "Laboratory",
			},
		},
		{
			$unwind: {
				path: "$Patient",
			},
		},
		{
			$match: {
				"Patient.Name": { $regex: PatientName, $options: "i" },
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
				haveLaboratory: {
					$cond: {
						if: { $gt: [{ $size: "$Laboratory" }, 0] },
						then: true,
						else: false,
					},
				},
			},
		},
		{
			$sort: {
				Patient_Name: 1,
			},
		},
		{
			$skip: (Page - 1) * limit,
		},
		{
			$limit: limit,
		},
	]);

	//console.log(search_Object);
	const Max_Page = Math.floor(Patient_count.length / limit) + 1;

	return res
		.status(200)
		.send({ case_object: search_Object, Page: Page, limit: limit, Max_Page: Max_Page });
};
