import mongoose from "mongoose";
import Malaria from "../Model/Malaria.js";
import { status_code } from "../Common/status_code.js";

const Case = Malaria.case;
const Patient = Malaria.Patient;

export const getPatientList = async (req, res) => {
	const Doctor_id = req.query.Doctor_id;

	if (!mongoose.Types.ObjectId.isValid(Doctor_id)) {
		return res.status(404).send({
			status: status_code.Failed,
			Error: "Doctor id is not valid",
		});
	}

	var PatientObject = await Case.aggregate([
		{
			$match: {
				Doctor_id: mongoose.Types.ObjectId(Doctor_id),
			},
		},
		{
			$group: {
				_id: null,
				Patient_id: {
					$addToSet: "$Patient_id",
				},
			},
		},
		{
			$lookup: {
				from: "Patient",
				let: { patient_id: "$Patient_id" },
				pipeline: [{ $match: { $expr: { $in: ["$_id", "$$patient_id"] } } }],
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
				Patient_id: "$Patient._id",
				Name: "$Patient.Name",
				Phone: "$Patient.Phone",
				Age: "$Patient.Age",
				Email: "$Patient.Email",
			},
		},
	]);

	//console.log(PatientObject);
	return res.status(200).send({ data: PatientObject });
};

export const getPatientById = async (req, res) => {
	const Patient_id = req.query.Patient_id;

	if (!mongoose.Types.ObjectId.isValid(Patient_id)) {
		return res.status(404).send({
			status: status_code.Failed,
			Error: "Patient id is not valid",
		});
	}

	const Patient_Object = await Patient.findOne(
		{ _id: Patient_id },
		{
			Home: 1,
			Work: 1,
			Name: 1,
			Email: 1,
			Id: 1,
			Phone: 1,
			Age: 1,
			Pregnant: 1,
			PregnantDate: 1,
			Gender: 1,
		}
	);

	return res.status(200).send(Patient_Object);
};

export const editPersonalInformationById = async (req, res) => {
	const Patient_id = req.body.Patient_id;
	const report_data = req.body.report_data;

	const Patient_data = report_data.Patient_data;

	if (!mongoose.Types.ObjectId.isValid(Patient_id)) {
		return res.status(404).send({
			status: status_code.Failed,
			Error: "Patient id format is not valid",
		});
	}

	if (!report_data) {
		return res.status(404).send({ status: status_code.Failed, Error: "report_data is not valid" });
	}

	// return res
	// 	.status(200)
	// 	.send({ status: status_code.Success, Message: "Personal Information Updated" });

	await Patient.findOneAndUpdate({ _id: Patient_id }, Patient_data, { new: true })
		.then(data => {
			return res
				.status(200)
				.send({ status: status_code.Success, Message: "Personal Information Updated" });
		})
		.catch(err => {
			return res.status(404).send({ status_code: status_code.Error, Error: err });
		});
};

export const searchPatientWithQuery = async (req, res) => {
	const Doctor_id = req.query.Doctor_id;
	const searchQuery = req.query.searchQuery;
	const Page = Number(req.query.Page);
	const limit = Number(req.query.limit);

	if (!mongoose.Types.ObjectId.isValid(Doctor_id)) {
		return res.status(404).send({
			status: status_code.Failed,
			Error: "Doctor id is not valid",
		});
	}

	const patient_query = [
		{
			$match: {
				Doctor_id: mongoose.Types.ObjectId(Doctor_id),
			},
		},
		{
			$group: {
				_id: null,
				Patient_id: {
					$addToSet: "$Patient_id",
				},
			},
		},
		{
			$lookup: {
				from: "Patient",
				let: { patient_id: "$Patient_id" },
				pipeline: [{ $match: { $expr: { $in: ["$_id", "$$patient_id"] } } }],
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
				$or: [
					{ "Patient.Name": { $regex: searchQuery, $options: "i" } },
					{ "Patient.Id": { $regex: searchQuery, $options: "i" } },
				],
			},
		},
	];

	var Max_count = await Case.aggregate([...patient_query]).count("Patient");
	//console.log(Max_Page);
	Max_count = Max_count.length == 0 ? 1 : Max_count[0].Patient;

	const search_Object = await Case.aggregate([
		...patient_query,
		{
			$project: {
				_id: 0,
				Patient_id: "$Patient._id",
				Name: "$Patient.Name",
				Phone: "$Patient.Phone",
				Age: "$Patient.Age",
				Email: "$Patient.Email",
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
	const Max_Page = Math.floor(Max_count / limit) + 1;

	return res.status(200).send({ data: search_Object, Page, limit, Max_Page });
};
