import Malaria from "../Model/Malaria.js";
import { Account_status, status_code, User_Status, Y_Axis_Mode } from "../Common/status_code.js";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import * as dotenv from "dotenv";
import { Normal_User_Role } from "../Common/role.js";
import moment from "moment";
import Redis from "ioredis";
import {
	summary_color_wheel,
	Total_Case_Summary_wheel,
	Treatment_Summary_wheel,
} from "../Common/colorwheel.js";
import { All_Status, All_Threapy, All_Drug } from "../Common/Options.js";

dotenv.config();
const Redis_host = process.env.Redis_host;
const Redis_pass = process.env.Redis_pass;
const client = new Redis({
	host: Redis_host,
	port: 15102,
	password: Redis_pass,
});

client.on("connecting", () => {
	console.log("Connecting to Redis.");
});
client.on("connect", () => {
	console.log("Success! Redis connection established.");
});

const Doctor = Malaria.Doctor;
const Hospital = Malaria.Hospital;
const Audit = Malaria.Audit;
const Treatment = Malaria.Treatment;

// dotenv.config();
const mail_pass = process.env.mail_pass;

function generateRandomPassword(
	length,
	chars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
) {
	//const chars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
	let password = "";

	for (let i = 0; i < length; i++) {
		var randomNumber = Math.floor(Math.random() * chars.length);
		password += chars.substring(randomNumber, randomNumber + 1);
	}
	return password;
}

export const Register = async (req, res) => {
	const request = req.body;

	const Login_name = request.user.Login_name;
	const Role = request.user.Role;
	const Password = generateRandomPassword(8);
	const hashPassword = bcrypt.hashSync(Password, 10);
	const Phone_number = request.user.Phone_number;
	const Email = request.user.Email;
	const Hospital_id = mongoose.Types.ObjectId(request.user.Hospital_id);

	const exist_hospital_id = await Hospital.findOne({ _id: Hospital_id });
	if (exist_hospital_id == null) {
		return res.status(400).send({ status: status_code.Failed, Error: "Hospital id not exist" });
	}

	const newUser = new Doctor({
		Login_name,
		Role,
		Password: hashPassword,
		Phone_number,
		Email,
		Hospital_id,
		Account_status: Account_status.Pending,
	});

	const user = await Doctor.findOne({ Email: Email });

	if (user) {
		//console.log("User exists already");
		return res.status(400).send({ status: status_code.Failed, Error: "User exists already" });
	}

	var SuccessRegister = await newUser.save().catch(err => {
		console.log(err);
		return res.status(400).send({ status: status_code.Failed, Error: err.message });
	});

	//console.log(SuccessRegister);

	if (SuccessRegister) {
		let transporter = nodemailer.createTransport({
			service: "gmail",
			host: "smtp.gmail.com",
			auth: {
				user: "laukintung322@gmail.com", // generated ethereal user
				pass: mail_pass, // generated ethereal password
			},
		});

		const email = {
			from: '"Malaria-Admin" <laukintung322@gmail.com>"',
			//should change to Doctor email when implemented
			to: "laukintung322@gmail.com",
			subject: "validation on creating Account",
			html: `<html>
					<body>
						<p>Dear ${SuccessRegister.Login_name}</p>
						<p>if you received this email, 
						this mean Malaria app have add you as a user.
						Please open Malaria app and use the following one-time password to Login</p>
						<p>One time Password: ${Password}</p>
					</body>
				  </html>`,
		};

		let info = await transporter.sendMail(email).catch(err => {
			console.log(err);
		});

		//console.log(info.messageId);
		return res.status(200).send({
			status: status_code.Success,
			Message: "Add user successfully",
		});
	}
};

export const Login = async (req, res) => {
	const request = req.body;
	const Email = request.email;
	const Password = request.Password;

	const user = await Doctor.findOne({ Email: Email }).select({
		Login_name: 1,
		Role: 1,
		Account_status: 1,
		Password: 1,
	});
	if (!user) {
		return res.status(400).send({ status: status_code.Failed, Error: "User Not exist" });
	}
	if (user && bcrypt.compareSync(Password, user.Password)) {
		const token = jwt.sign(
			{
				login_name: user.Login_name,
				Doctor_id: user._id,
				role: user.Role,
				Hospital_id: user.Hospital_id,
				Account_status: user.Account_status,
			},
			"Malaria",
			{ expiresIn: "1d" }
		);
		const newAudit = new Audit({
			Doctor_id: user._id,
			Activity: `Doctor ${user._id} Login`,
			Audit_Code: "Malaria_User_Login",
		});

		await newAudit.save().catch(err => console.log(err));

		return res.status(200).send({
			status: status_code.Success,
			Message: "Login successful",
			token,
		});
	} else {
		return res.status(404).send({ status: status_code.Failed, Message: "Wrong Password" });
	}
};

export const GetAllUser = async (req, res) => {
	const All_User = await Doctor.find({}, { Login_name: 1, _id: 0 });

	if (!All_User) {
		return res.status(500).send({
			status: status_code.Failed,
			Message: "Server Error, no user display",
		});
	}

	return res.status(200).send({ status: status_code.Success, user_list: All_User });
};

export const GetNormalUsersFromHospital = async (req, res) => {
	var Doctor_id = req.query.Doctor_id;

	if (mongoose.Types.ObjectId.isValid(Doctor_id)) {
		Doctor_id = mongoose.Types.ObjectId(Doctor_id);
	} else {
		return res.status(404).send({
			status: status_code.Failed,
			Error: "Doctor id format is not valid",
		});
	}

	const user_object = await Doctor.findOne({ _id: Doctor_id }, {});
	const Hospital_id = user_object.Hospital_id;

	const NormalUser = await Doctor.find(
		{ Hospital_id: Hospital_id, Role: Normal_User_Role },
		{ Login_name: 1, Email: 1, Phone_number: 1, Account_status: 1 }
	).catch(err => {
		return res.status(404).send({ status: status_code.Failed, Error: err });
	});

	return res.status(200).send({ AccountManagement: NormalUser });
};

export const ResetPassword = async (req, res) => {
	const mode = req.body.mode;
	if (mode === User_Status.newUser) {
		var Doctor_id = req.body.Recovery_Info;
		const Password = bcrypt.hashSync(req.body.Password, 10);

		if (mongoose.Types.ObjectId.isValid(Doctor_id)) {
			Doctor_id = mongoose.Types.ObjectId(Doctor_id);
		} else {
			return res.status(400).send({ status: status_code.Failed, Error: "Doctor id is not valid" });
		}

		const Doctor_Object = await Doctor.findOneAndUpdate(
			{ _id: Doctor_id },
			{ Password: Password, Account_status: Account_status.Active },
			{ new: true }
		).catch(err => {
			return res.status(400).send({ status: status_code.Failed, Error: err });
		});

		if (Doctor_Object) {
			return res
				.status(200)
				.send({ status: status_code.Success, Message: "Reset Password Successful" });
		}
	} else if (mode === User_Status.reset) {
		var Email = req.body.Recovery_Info;
		const Password = bcrypt.hashSync(req.body.Password, 10);

		const Doctor_Object = await Doctor.findOneAndUpdate(
			{ Email: Email },
			{ Password: Password, Account_status: Account_status.Active },
			{ new: true }
		).catch(err => {
			return res.status(400).send({ status: status_code.Failed, Error: err });
		});

		if (Doctor_Object) {
			return res
				.status(200)
				.send({ status: status_code.Success, Message: "Reset Password Successful" });
		}
	}
};

export const GetAllUserFromHospital = async (req, res) => {
	var Doctor_id = req.query.Doctor_Id;

	if (mongoose.Types.ObjectId.isValid(Doctor_id)) {
		Doctor_id = mongoose.Types.ObjectId(Doctor_id);
	} else {
		return res.status(404).send({
			status: status_code.Failed,
			Error: "Doctor id format is not valid",
		});
	}

	const user_object = await Doctor.findOne({ _id: Doctor_id }, {});
	const Hospital_id = user_object.Hospital_id;

	var UserObject = await Doctor.find(
		{ Hospital_id: Hospital_id, _id: { $ne: Doctor_id } },
		{ Login_name: 1, Email: 1, Phone_number: 1, Account_status: 1 }
	).catch(err => {
		return res.status(404).send({ status: status_code.Failed, Error: err });
	});

	UserObject = UserObject.map(d => ({ id: d._id, item: d.Login_name }));
	return res.status(200).send(UserObject);
};

export const GetAuditFromDoctorId = async (req, res) => {
	var Doctor_id = req.query.target_Doctor_id;

	if (!mongoose.Types.ObjectId.isValid(Doctor_id)) {
		return res.status(404).send({
			status: status_code.Failed,
			Error: "Doctor id format is not valid",
		});
	} else {
		Doctor_id = mongoose.Types.ObjectId(Doctor_id);
	}

	var Doctor_Object = await Audit.find(
		{ Doctor_id: Doctor_id },
		{ Audit_Code: 1, Activity: 1, dtCreated: 1, _id: 0 }
	).sort([["dtCreated", 1]]);

	Doctor_Object = Doctor_Object.map(d => {
		return {
			Audit_Code: d.Audit_Code,
			Activity: d.Activity,
			dtCreated: moment(d.dtCreated).format("YYYY-MM-DD hh:mm").toString(),
		};
	});

	return res.status(200).send(Doctor_Object);
};

export const ForgetordProcess = async (req, res) => {
	const Email = req.body.Email;

	const Doctor_Object = await Doctor.findOne({ Email: Email }).catch(err => {
		return res.status(400).send({
			status: status_code.Failed,
			Message: err,
		});
	});

	if (!Doctor_Object) {
		return res.status(400).send({
			status: status_code.Failed,
			Message: "User Email is not exists in Malaria App Database. Please try again",
		});
	}

	const Authentication_Code = generateRandomPassword(6, "0123456789");
	//console.log("Authentication Code: ", Authentication_Code);
	client.setex(`${Email}:Auth`, 180, Authentication_Code);

	let transporter = nodemailer.createTransport({
		service: "gmail",
		host: "smtp.gmail.com",
		auth: {
			user: "laukintung322@gmail.com", // generated ethereal user
			pass: mail_pass, // generated ethereal password
		},
	});

	const email = {
		from: '"Malaria-Admin" <laukintung322@gmail.com>"',
		//should change to Doctor email when implemented
		to: "laukintung322@gmail.com",
		subject: "Recovery Process",
		html: `<html>
				<body>
					<p>Dear User:</p>
					<p>Malaria System have receive your Requests to receive Password, Please enter the following Authentication code to continue the Forget Password ProcessAuthentication Code</p>
					<p><b>The Authentication code only exists for 3 minutes, Please enter the Authentication code as soon as possible. Otherwise, you need to restart the Recovery process</b></p>
					<p>Authentication Code: ${Authentication_Code}</p>
				</body>
			  </html>`,
	};

	let info = await transporter.sendMail(email).catch(err => {
		console.log(err);
	});

	return res.status(200).send({ status: status_code.Success });
};

export const RecoveryAuthentication = async (req, res) => {
	const Authentication_Code = req.body.AuthenticationCode;
	const Email = req.body.Email;

	const value = await client.getex(`${Email}:Auth`).catch(err => console.log(err));

	if (value !== Authentication_Code) {
		return res
			.status(400)
			.send({ status: status_code.Failed, Message: "Wrong Authentication Code" });
	}

	const Doctor_Object = await Doctor.findOneAndUpdate(
		{
			Email: Email,
		},
		{
			Account_status: Account_status.Blocked,
		},
		{
			new: true,
		}
	).catch(err => {
		return res
			.status(400)
			.send({ status: status_code.Failed, Message: "Internal Error: Account Status not updated" });
	});

	if (Doctor_Object) {
		return res.status(200).send({ status: status_code.Success });
	}
};

export const deleteUser = async (req, res) => {
	var Doctor_id = req.body.Doctor_id;

	if (!mongoose.Types.ObjectId.isValid(Doctor_id)) {
		return res.status(404).send({
			status: status_code.Failed,
			Error: "Doctor id is not valid",
		});
	} else {
		Doctor_id = mongoose.Types.ObjectId(Doctor_id);
	}

	const Doctor_Object = await Doctor.findOneAndUpdate(
		{
			_id: Doctor_id,
		},
		{
			Account_status: Account_status.Deleted,
		},
		{
			new: true,
		}
	).catch(err => {
		return res
			.status(400)
			.send({ status: status_code.Failed, Message: "Internal Error: Account Status not updated" });
	});

	if (Doctor_Object) {
		const Hospital_id = Doctor_Object.Hospital_id;
		const NormalUser = await Doctor.find(
			{ Hospital_id: Hospital_id, Role: Normal_User_Role },
			{ Login_name: 1, Email: 1, Phone_number: 1, Account_status: 1 }
		).catch(err => {
			return res.status(404).send({ status: status_code.Failed, Message: err });
		});

		return res.status(200).send({
			status: status_code.Success,
			AccountManagement: NormalUser,
			Message: `user ${Doctor_Object.Login_name} deleted successfully`,
		});
	} else {
		return res
			.status(400)
			.send({ status: status_code.Failed, Message: "Doctor not exists in System" });
	}
};

export const recoverUser = async (req, res) => {
	var Doctor_id = req.body.Doctor_id;

	if (!mongoose.Types.ObjectId.isValid(Doctor_id)) {
		return res.status(404).send({
			status: status_code.Failed,
			Error: "Doctor id is not valid",
		});
	} else {
		Doctor_id = mongoose.Types.ObjectId(Doctor_id);
	}

	const Doctor_Object = await Doctor.findOneAndUpdate(
		{
			_id: Doctor_id,
		},
		{
			Account_status: Account_status.Active,
		},
		{
			new: true,
		}
	).catch(err => {
		return res
			.status(400)
			.send({ status: status_code.Failed, Message: "Internal Error: Account Status not updated" });
	});

	if (Doctor_Object) {
		const Hospital_id = Doctor_Object.Hospital_id;
		const NormalUser = await Doctor.find(
			{ Hospital_id: Hospital_id, Role: Normal_User_Role },
			{ Login_name: 1, Email: 1, Phone_number: 1, Account_status: 1 }
		).catch(err => {
			return res.status(404).send({ status: status_code.Failed, Message: err });
		});

		return res.status(200).send({
			status: status_code.Success,
			AccountManagement: NormalUser,
			Message: `user ${Doctor_Object.Login_name} recover successfully`,
		});
	} else {
		return res
			.status(400)
			.send({ status: status_code.Failed, Message: "Doctor not exists in System" });
	}
};

export const SearchQueryForUser = async (req, res) => {
	var Doctor_id = req.query.Doctor_id;
	const searchQuery = req.query.searchQuery;
	const Page = Number(req.query.Page);
	const limit = Number(req.query.limit);

	// console.log(Page);
	// console.log(limit);

	if (mongoose.Types.ObjectId.isValid(Doctor_id)) {
		Doctor_id = mongoose.Types.ObjectId(Doctor_id);
	} else {
		return res.status(404).send({
			status: status_code.Failed,
			Message: "Doctor id format is not valid",
		});
	}

	const user_object = await Doctor.findOne({ _id: Doctor_id }, {});

	if (user_object) {
		const Hospital_id = user_object.Hospital_id;
		const NormalUser = await Doctor.aggregate([
			{
				$match: {
					Hospital_id: Hospital_id,
					Role: Normal_User_Role,
					Login_name: { $regex: searchQuery, $options: "i" },
				},
			},
			{
				$project: {
					Login_name: 1,
					Email: 1,
					Phone_number: 1,
					Account_status: 1,
				},
			},
			{
				$skip: (Page - 1) * limit,
			},
			{
				$limit: limit,
			},
		]);

		const Max_Page = Math.floor(NormalUser.length / limit) + 1;
		//console.log(Max_Page);

		return res.status(200).send({ AccountManagement: NormalUser, Page, limit, Max_Page });
	} else {
		return res
			.status(400)
			.send({ status: status_code.Failed, Error: "Doctor Id not exist in system" });
	}
};

export const HospitalSummaryData = async (req, res) => {
	const Doctor_id = req.query.Doctor_id;
	//console.log(Doctor_id);

	if (!mongoose.Types.ObjectId.isValid(Doctor_id)) {
		return res.status(404).send({
			status: status_code.Failed,
			Message: "Doctor id format is not valid",
		});
	}
	const user_object = await Doctor.findOne({ _id: Doctor_id }, {});

	if (user_object) {
		const Hospital_id = user_object.Hospital_id;
		const Patient_Status_Summary = await Doctor.aggregate([
			{
				$match: {
					Hospital_id: Hospital_id,
					_id: { $ne: mongoose.Types.ObjectId(Doctor_id) },
					Role: Normal_User_Role,
				},
			},
			{
				$lookup: {
					from: "Case",
					localField: "_id",
					foreignField: "Doctor_id",
					as: "Case",
				},
			},
			{
				$project: {
					Case: 1,
				},
			},
			{
				$unwind: {
					path: "$Case",
				},
			},
			{
				$group: {
					_id: "$Case.Report_Status",
					survived: {
						$sum: {
							$cond: {
								if: { $eq: ["$Case.Patient_Status", "survived"] },
								then: 1,
								else: 0,
							},
						},
					},
					Died: {
						$sum: {
							$cond: {
								if: { $eq: ["$Case.Patient_Status", "Died"] },
								then: 1,
								else: 0,
							},
						},
					},
					Stable: {
						$sum: {
							$cond: {
								if: { $eq: ["$Case.Patient_Status", "Stable"] },
								then: 1,
								else: 0,
							},
						},
					},
					Emergency: {
						$sum: {
							$cond: {
								if: { $eq: ["$Case.Patient_Status", "Emergency"] },
								then: 1,
								else: 0,
							},
						},
					},
					Unknown: {
						$sum: {
							$cond: {
								if: { $eq: ["$Case.Patient_Status", "Unknown"] },
								then: 1,
								else: 0,
							},
						},
					},
				},
			},
		]);

		let Patient_Summary = [];
		for (let i = 0; i < Patient_Status_Summary.length; i++) {
			const data = Patient_Status_Summary[i];
			const label = data._id;

			let combine_data = [];
			Object.keys(data).forEach(key => {
				if (key != "_id") {
					combine_data.push({
						name: key,
						data: data[key],
						color: summary_color_wheel[key],
						legendFontColor: "#7F7F7F",
						legendFontSize: 15,
					});
				}
			});
			Patient_Summary.push({ label, data: combine_data });
		}
		return res.status(200).send({ Patient_Summary });
	} else {
		return res
			.status(400)
			.send({ status: status_code.Failed, Error: "Doctor Id not exist in system" });
	}
};

export const TreatmentSummaryData = async (req, res) => {
	const Doctor_id = req.query.Doctor_id;

	if (!mongoose.Types.ObjectId.isValid(Doctor_id)) {
		return res.status(404).send({
			status: status_code.Failed,
			Message: "Doctor id format is not valid",
		});
	}

	const user_object = await Doctor.findOne({ _id: Doctor_id }, {});

	if (user_object) {
		const Hospital_id = user_object.Hospital_id;
		// console.log(Hospital_id);
		// console.log(Doctor_id);

		var case_ids = await Doctor.aggregate([
			{
				$match: {
					Hospital_id: Hospital_id,
					_id: { $ne: mongoose.Types.ObjectId(Doctor_id) },
					Role: Normal_User_Role,
				},
			},
			{
				$project: {
					Doctor_id: "$_id",
					_id: 0,
				},
			},
			{
				$lookup: {
					from: "Case",
					localField: "Doctor_id",
					foreignField: "Doctor_id",
					as: "Case",
				},
			},
			{
				$unwind: {
					path: "$Case",
				},
			},
			{
				$project: {
					case_id: "$Case._id",
				},
			},
		]);

		case_ids = case_ids.map(d => d.case_id);

		const case_Objects = await Treatment.aggregate([
			{
				$match: {
					case_id: { $in: case_ids },
				},
			},
			{
				$group: {
					_id: null,
					Received: {
						$sum: {
							$cond: {
								if: { $eq: ["$Received", "Yes"] },
								then: 1,
								else: 0,
							},
						},
					},
					Not_Received: {
						$sum: {
							$cond: {
								if: { $eq: ["$Received", "No"] },
								then: 1,
								else: 0,
							},
						},
					},
				},
			},
			{
				$project: {
					_id: 0,
					Received: 1,
					Not_Received: 1,
				},
			},
		]);

		//console.log(case_Objects);
		const exist_case = case_Objects[0].Received + case_Objects[0].Not_Received;
		const total_case = case_ids.length;

		var Treatment_status = [];
		for (let i = 0; i < case_Objects.length; i++) {
			const data = case_Objects[i];
			let combine_data = [];

			Object.keys(data).forEach(key => {
				if (key != "_id") {
					combine_data.push({
						name: key,
						data: data[key],
						color: Total_Case_Summary_wheel[key],
						legendFontColor: "#7F7F7F",
						legendFontSize: 10,
					});
				}
			});

			Treatment_status.push({ label: "Treatment status", data: combine_data });
		}
		// console.log(...Treatment_status);

		var temp_Summary = [{ Have_Treatement: exist_case, No_Treatment: total_case - exist_case }];
		var Treatment_Summary = [];
		for (let i = 0; i < temp_Summary.length; i++) {
			const data = temp_Summary[i];

			let combine_data = [];

			Object.keys(data).forEach(key => {
				if (key != "_id") {
					combine_data.push({
						name: key,
						data: data[key],
						color: Treatment_Summary_wheel[key],
						legendFontColor: "#7F7F7F",
						legendFontSize: 10,
					});
				}
			});
			Treatment_Summary.push({ label: "Treatment summary", data: combine_data });
		}

		const Treatment_count = await Doctor.aggregate([
			{
				$match: {
					Hospital_id: Hospital_id,
					_id: { $ne: mongoose.Types.ObjectId(Doctor_id) },
					Role: Normal_User_Role,
				},
			},
			{
				$project: {
					Doctor_id: "$_id",
					_id: 0,
				},
			},
			{
				$lookup: {
					from: "Case",
					localField: "Doctor_id",
					foreignField: "Doctor_id",
					as: "Case",
				},
			},
			{
				$unwind: {
					path: "$Case",
				},
			},
			{
				$group: {
					_id: "$Case.Patient_Status",
					case_ids: {
						$push: "$Case._id",
					},
				},
			},
			{
				$lookup: {
					from: "Treatment",
					let: {
						case_ids: "$case_ids",
					},
					pipeline: [
						{
							$match: {
								$expr: {
									$in: ["$case_id", "$$case_ids"],
								},
							},
						},
						{
							$match: {
								$expr: {
									$eq: ["$Received", "Yes"],
								},
							},
						},
					],
					as: "Treatment",
				},
			},
			{
				$project: {
					Patient_Status: "$_id",
					Threapy: {
						$cond: {
							if: { $ne: ["$Treatment.Therapy_Other", ""] },
							then: "$Treatment.Therapy",
							else: "$Treatment.Therapy_Other",
						},
					},
					_id: 0,
				},
			},
			{
				$unwind: {
					path: "$Threapy",
				},
			},
			{
				$group: {
					_id: {
						Threapy: "$Threapy",
						Patient_Status: "$Patient_Status",
					},
					count: {
						$sum: 1,
					},
				},
			},
			{
				$project: {
					Threapy: "$_id.Threapy",
					Patient_Status: "$_id.Patient_Status",
					count: 1,
					_id: 0,
				},
			},
		]);

		var Treatment_count_map = new Map();
		for (let i = 0; i < Treatment_count.length; i++) {
			if (!Treatment_count_map.has(Treatment_count[i].Threapy)) {
				Treatment_count_map.set(Treatment_count[i].Threapy, [
					{
						count: Treatment_count[i].count,
						Patient_Status: Treatment_count[i].Patient_Status,
					},
				]);
			} else {
				var copy_data = Treatment_count_map.get(Treatment_count[i].Threapy);
				copy_data.push({
					count: Treatment_count[i].count,
					Patient_Status: Treatment_count[i].Patient_Status,
				});
			}
		}

		const Treatment_count_map_keys = Array.from(Treatment_count_map.keys());
		for (let i = 0; i < All_Threapy.length; i++) {
			if (!Treatment_count_map_keys.includes(All_Threapy[i])) {
				var data = [];
				for (let i = 0; i < All_Status.length; i++) {
					data.push({ count: 0, Patient_Status: All_Status[i] });
				}
				Treatment_count_map.set(All_Threapy[i], data);
			}
		}
		Treatment_count_map = new Map([...Treatment_count_map].sort());
		//console.log(Treatment_count_map);
		var Treatment_count_data = [];
		for (const [key, value] of Treatment_count_map) {
			var copy_data = [];

			const Patient_Status = value.map(d => d.Patient_Status);

			for (let i = 0; i < All_Status.length; i++) {
				if (!Patient_Status.includes(All_Status[i])) {
					copy_data.push({
						count: 0,
						Patient_Status: All_Status[i],
					});
				} else {
					const filter = value.filter(d => d.Patient_Status === All_Status[i]);
					copy_data = copy_data.concat(filter);
					//copy_data.push(filter);
				}
			}
			//console.log(copy_data);
			const label = copy_data.map(d => d.Patient_Status);
			const data = copy_data.map(d => d.count);

			Treatment_count_data.push({ title: key, label, data });
		}

		const Drug_Object = await Doctor.aggregate([
			{
				$match: {
					Hospital_id: Hospital_id,
					_id: { $ne: mongoose.Types.ObjectId(Doctor_id) },
					Role: Normal_User_Role,
				},
			},
			{
				$project: {
					Doctor_id: "$_id",
					_id: 0,
				},
			},
			{
				$lookup: {
					from: "Case",
					localField: "Doctor_id",
					foreignField: "Doctor_id",
					as: "Case",
				},
			},
			{
				$unwind: {
					path: "$Case",
				},
			},
			{
				$group: {
					_id: "$Case.Patient_Status",
					case_ids: {
						$push: "$Case._id",
					},
				},
			},
			{
				$lookup: {
					from: "Treatment",
					let: {
						case_ids: "$case_ids",
					},
					pipeline: [
						{
							$match: {
								$expr: {
									$in: ["$case_id", "$$case_ids"],
								},
							},
						},
						{
							$match: {
								$expr: {
									$eq: ["$Received", "Yes"],
								},
							},
						},
					],
					as: "Treatment",
				},
			},
			{
				$project: {
					Patient_Status: "$_id",
					Drug: {
						$cond: {
							if: { $ne: ["$Treatment.Drug_taken_Other", ""] },
							then: "$Treatment.Drug_taken",
							else: "$Treatment.Drug_taken_Other",
						},
					},
					_id: 0,
				},
			},
			{
				$unwind: {
					path: "$Drug",
				},
			},
			{
				$group: {
					_id: {
						Drug: "$Drug",
						Patient_Status: "$Patient_Status",
					},
					count: { $sum: 1 },
				},
			},
			{
				$project: {
					Patient_Status: "$_id.Patient_Status",
					Drug: "$_id.Drug",
					count: 1,
					_id: 0,
				},
			},
		]);

		var Drug_map = new Map();
		for (let i = 0; i < Drug_Object.length; i++) {
			if (!Drug_map.has(Drug_Object[i].Drug)) {
				Drug_map.set(Drug_Object[i].Drug, [
					{
						count: Drug_Object[i].count,
						Patient_Status: Drug_Object[i].Patient_Status,
					},
				]);
			} else {
				var copy_data = Drug_map.get(Drug_Object[i].Drug);
				copy_data.push({
					count: Drug_Object[i].count,
					Patient_Status: Drug_Object[i].Patient_Status,
				});
			}
		}

		const Drug_map_keys = Array.from(Drug_map.keys());
		for (let i = 0; i < All_Drug.length; i++) {
			if (!Drug_map_keys.includes(All_Drug[i])) {
				var data = [];
				for (let i = 0; i < All_Status.length; i++) {
					data.push({ count: 0, Patient_Status: All_Status[i] });
				}
				Drug_map.set(All_Drug[i], data);
			}
		}
		Drug_map = new Map([...Drug_map].sort());
		var Drug_data = [];
		for (const [key, value] of Drug_map) {
			var copy_data = [];

			const Patient_Status = value.map(d => d.Patient_Status);

			for (let i = 0; i < All_Status.length; i++) {
				if (!Patient_Status.includes(All_Status[i])) {
					copy_data.push({
						count: 0,
						Patient_Status: All_Status[i],
					});
				} else {
					const filter = value.filter(d => d.Patient_Status === All_Status[i]);
					copy_data = copy_data.concat(filter);
					//copy_data.push(filter);
				}
			}
			//console.log(copy_data);
			const label = copy_data.map(d => d.Patient_Status);
			const data = copy_data.map(d => d.count);

			Drug_data.push({ title: key, label, data });
		}

		//console.log(Drug_data);

		return res
			.status(200)
			.send({ Treatment_status, Treatment_Summary, Treatment_count_data, Drug_data });
	} else {
		return res
			.status(400)
			.send({ status: status_code.Failed, Error: "Doctor Id not exist in system" });
	}
};

export const AdminAnalytics = async (req, res) => {
	const Doctor_id = req.query.Doctor_id;
	const xAxis = req.query.xAxis;
	//const xAxis = "Hosplitalization"
	const yAxis = req.query.yAxis;
	const mode = req.query.mode;
	// console.log(mode);

	if (!mongoose.Types.ObjectId.isValid(Doctor_id)) {
		return res.status(404).send({
			status: status_code.Failed,
			Message: "Doctor id format is not valid",
		});
	}

	const user_object = await Doctor.findOne({ _id: Doctor_id }, {});

	if (user_object) {
		const Hospital_id = user_object.Hospital_id;
		// console.log(Hospital_id);
		// console.log(Doctor_id);

		var Analytics = null;
		switch (mode) {
			case Y_Axis_Mode.searchWithSign:
				Analytics = await getSignResults(Doctor_id, Hospital_id, xAxis, yAxis);
				break;
			case Y_Axis_Mode.searchWithComplications:
				Analytics = await getComplicationResult(Doctor_id, Hospital_id, xAxis, yAxis);
				break;
			default:
				break;
		}
		//console.log(...Analytics);
		return res.status(200).send({ Analytics: Analytics });
	} else {
		return res
			.status(400)
			.send({ status: status_code.Failed, Error: "Doctor Id not exist in system" });
	}
};

async function getSignResults(Doctor_id, Hospital_id, xAxis, yAxis) {
	var matching_query = [
		{
			$match: {
				Hospital_id: Hospital_id,
				_id: { $ne: mongoose.Types.ObjectId(Doctor_id) },
				Role: Normal_User_Role,
			},
		},
		{
			$project: {
				Doctor_id: "$_id",
				_id: 0,
			},
		},
	];

	var group_query = [
		{
			$group: {
				_id: {
					Sign: "$Sign",
					[xAxis]: `$${xAxis}`,
				},
				count: {
					$sum: 1,
				},
			},
		},
		{
			$project: {
				Sign: "$_id.Sign",
				[xAxis]: `$_id.${xAxis}`,
				count: 1,
				_id: 0,
			},
		},
		{
			$sort: {
				[xAxis]: 1,
			},
		},
		{
			$group: {
				_id: "$Sign",
				data: {
					$push: {
						[xAxis]: `$${xAxis}`,
						count: "$count",
					},
				},
			},
		},
		{
			$project: {
				Sign: "$_id",
				data: 1,
				_id: 0,
			},
		},
		{
			$match: {
				Sign: yAxis,
			},
		},
	];

	let lookup_query = [];

	if (xAxis == "Age") {
		lookup_query = [
			{
				$lookup: {
					from: "Case",
					let: { id: "$Doctor_id" },
					pipeline: [
						{ $match: { $expr: { $eq: ["$Doctor_id", "$$id"] } } },
						{
							$project: {
								Sign: "$Symptoms.Sign",
								Patient_id: "$Patient_id",
								_id: 0,
							},
						},
					],
					as: "Case",
				},
			},
			{
				$unwind: {
					path: "$Case",
				},
			},
			{
				$project: {
					Sign: "$Case.Sign",
					Patient_id: "$Case.Patient_id",
				},
			},
			{
				$unwind: {
					path: "$Sign",
				},
			},
			{
				$lookup: {
					from: "Patient",
					let: { id: "$Patient_id" },
					pipeline: [
						{ $match: { $expr: { $eq: ["$_id", "$$id"] } } },
						{
							$project: {
								Age: 1,
								_id: 0,
							},
						},
					],
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
					Sign: 1,
					Age: "$Patient.Age",
				},
			},
		];
	} else {
		lookup_query = [
			{
				$lookup: {
					from: "Case",
					let: {
						id: "$Doctor_id",
					},
					pipeline: [
						{
							$match: {
								$expr: {
									$eq: ["$Doctor_id", "$$id"],
								},
							},
						},
						{
							$project: {
								Sign: "$Symptoms.Sign",
								[xAxis]: {
									$size: `$${xAxis}`,
								},
								Patient_id: "$Patient_id",
								_id: 0,
							},
						},
					],
					as: "Case",
				},
			},
			{
				$unwind: {
					path: "$Case",
				},
			},
			{
				$project: {
					Sign: "$Case.Sign",
					[xAxis]: `$Case.${xAxis}`,
					Patient_id: "$Case.Patient_id",
				},
			},
			{
				$unwind: {
					path: "$Sign",
				},
			},
		];
	}

	const Analytics = await Doctor.aggregate([...matching_query, ...lookup_query, ...group_query]);

	return Analytics;
}

async function getComplicationResult(Doctor_id, Hospital_id, xAxis, yAxis) {
	let matching_query = [
		{
			$match: {
				Hospital_id: Hospital_id,
				_id: { $ne: mongoose.Types.ObjectId(Doctor_id) },
				Role: Normal_User_Role,
			},
		},
		{
			$project: {
				Doctor_id: "$_id",
				_id: 0,
			},
		},
	];

	let group_query = [
		{
			$group: {
				_id: {
					Complications: "$Complications",
					[xAxis]: `$${xAxis}`,
				},
				count: {
					$sum: 1,
				},
			},
		},
		{
			$project: {
				Complications: "$_id.Complications",
				[xAxis]: `$_id.${xAxis}`,
				count: 1,
				_id: 0,
			},
		},
		{
			$sort: {
				Age: 1,
			},
		},
		{
			$group: {
				_id: "$Complications",
				data: {
					$push: {
						[xAxis]: `$${xAxis}`,
						count: "$count",
					},
				},
			},
		},
		{
			$project: {
				Complications: "$_id",
				data: 1,
				_id: 0,
			},
		},
		{
			$match: {
				Complications: yAxis,
			},
		},
	];

	let lookup_query = [];

	if (xAxis == "Age") {
		lookup_query = [
			{
				$lookup: {
					from: "Case",
					let: {
						id: "$Doctor_id",
					},
					pipeline: [
						{
							$match: {
								$expr: {
									$eq: ["$Doctor_id", "$$id"],
								},
							},
						},
						{
							$project: {
								Complications: "$Clinical_Complications.Complications",
								Patient_id: "$Patient_id",
								_id: 0,
							},
						},
					],
					as: "Case",
				},
			},
			{
				$unwind: {
					path: "$Case",
				},
			},
			{
				$project: {
					Complications: "$Case.Complications",
					Patient_id: "$Case.Patient_id",
				},
			},
			{
				$unwind: {
					path: "$Complications",
				},
			},
			{
				$lookup: {
					from: "Patient",
					let: {
						id: "$Patient_id",
					},
					pipeline: [
						{
							$match: {
								$expr: {
									$eq: ["$_id", "$$id"],
								},
							},
						},
						{
							$project: {
								Age: 1,
								_id: 0,
							},
						},
					],
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
					Complications: 1,
					Age: "$Patient.Age",
				},
			},
		];
	} else {
		lookup_query = [
			{
				$lookup: {
					from: "Case",
					let: {
						id: "$Doctor_id",
					},
					pipeline: [
						{
							$match: {
								$expr: {
									$eq: ["$Doctor_id", "$$id"],
								},
							},
						},
						{
							$project: {
								Complications: "$Clinical_Complications.Complications",
								[xAxis]: {
									$size: `$${xAxis}`,
								},
								Patient_id: "$Patient_id",
								_id: 0,
							},
						},
					],
					as: "Case",
				},
			},
			{
				$unwind: {
					path: "$Case",
				},
			},
			{
				$project: {
					Complications: "$Case.Complications",
					[xAxis]: `$Case.${xAxis}`,
				},
			},
			{
				$unwind: {
					path: "$Complications",
				},
			},
		];
	}

	const Analytics = await Doctor.aggregate([...matching_query, ...lookup_query, ...group_query]);

	return Analytics;
}
