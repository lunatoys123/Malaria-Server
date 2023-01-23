import Malaria from "../Model/Malaria.js";
import { Account_status, status_code } from "../Common/status_code.js";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import * as dotenv from "dotenv";
import { Normal_User_Role } from "../Common/role.js";

const Doctor = Malaria.Doctor;
const Hospital = Malaria.Hospital;
const Audit = Malaria.Audit;

dotenv.config();
const mail_pass = process.env.mail_pass;

function generateRandomPassword(length) {
	const chars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
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
		return res.status(400).send({ status: status_code.Failed, Message: "Hospital id not exist" });
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

		await newAudit
			.save()
			.then(data => console.log(data))
			.catch(err => console.log(err));
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
		return res.status(404).send({ status_code: status_code.Failed, Error: err });
	});

	return res.status(200).send({ AccountManagement: NormalUser });
};

export const ResetPassword = async (req, res) => {
	var Doctor_id = req.body.Doctor_id;
	const Password = bcrypt.hashSync(req.body.Password, 10);

	if (mongoose.Types.ObjectId.isValid(Doctor_id)) {
		Doctor_id = mongoose.Types.ObjectId(Doctor_id);
	} else {
		return res
			.status(400)
			.send({ status_code: status_code.Failed, Error: "Doctor id is not valid" });
	}

	const Doctor_Object = await Doctor.findOneAndUpdate(
		{ _id: Doctor_id },
		{ Password: Password, Account_status: Account_status.Active },
		{ new: true }
	).catch(err => {
		return res.status(400).send({ status_code: status_code.Failed, Error: err });
	});

	if (Doctor_Object) {
		return res
			.status(200)
			.send({ status_code: status_code.Success, Message: "Reset Password Successful" });
	}
};

export const GetAllUserFromHospital = async (req, res) => {
	var Doctor_id = req.query.Doctor_Id;
	console.log(Doctor_id);

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
