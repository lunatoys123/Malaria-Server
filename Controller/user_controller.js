import Malaria from "../Model/Malaria.js";
import { status_code } from "../Common/status_code.js";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";

const Doctor = Malaria.Doctor;
const Hospital = Malaria.Hospital;

export const Register = async (req, res) => {
	const request = req.body;

	const Login_name = request.user.Login_name;
	const Role = request.user.Role;
	const Password = bcrypt.hashSync(request.user.Password, 10);
	const Phone_number = request.user.Phone_number;
	const Email = request.user.Email;
	const Hospital_id = mongoose.Types.ObjectId(request.user.Hospital_id);

	const exist_hospital_id = await Hospital.findOne({ _id: Hospital_id });
	if (exist_hospital_id == null) {
		return res.status(400).send({ status: status_code.Failed, Message: "Hospital id not exist" });
	}

	const newUser = new Doctor({
		Login_name,
		Role,
		Password,
		Phone_number,
		Email,
		Hospital_id,
		Account_status: "active",
	});

	const user = await Doctor.findOne({ Email: Email });

	if (user) {
		console.log("User exists already");
		return res.status(400).send({ status: status_code.Failed, Error: "User exists already" });
	}

	// await newUser
	// 	.save()
	// 	.then(data => {
	// 		return res.status(200).send({
	// 			status: status_code.Success,
	// 			Message: "Add user successfully",
	// 		});
	// 	})
	// 	.catch(err => {
	// 		return res.status(400).send({ status: status_code.Failed, error: err.message });
	// 	});

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
				pass: "odyhoziqkunvjkcj", // generated ethereal password
			},
		});

		const email = {
			from: '"Malaria-Admin" <laukintung322@gmail.com>"',
			to: "laukintung322@gmail.com",
			subject: "validation on creating Account",
			html: `<html>
					<body>
						<p>Dear ${SuccessRegister.Login_name}</p>
						<p>if you received this email, this mean Malaria app have add you as a user. Please open Malaria app to Login</p>
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

	const user = await Doctor.findOne({ Email: Email });
	if (!user) {
		return res.status(400).send({ status: status_code.Failed, Message: "User Not exist" });
	}
	if (user && bcrypt.compareSync(Password, user.Password)) {
		const token = jwt.sign(
			{
				login_name: user.Login_name,
				Doctor_id: user._id,
				role: user.Role,
				Hospital_id: user.Hospital_id,
			},
			"Malaria",
			{ expiresIn: "1d" }
		);

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

export const GetUsersFromHospital = async (req, res) => {
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
		{ Hospital_id: Hospital_id, Role: "NU" },
		{ Login_name: 1, Email: 1, Phone_number: 1, Account_status: 1 }
	).catch(err => {
		return res.status(404).send({ status_code: status_code.Failed, Error: err });
	});

	return res.status(200).send({ AccountManagement: NormalUser });
};
