import Malaria from "../Model/Malaria.js"
import { status_code } from "../Common/status_code.js";
import bcrypt from "bcryptjs"
import mongoose from "mongoose"

const Doctor = Malaria.Doctor;
const Hospital = Malaria.Hospital;

export const Register = async (req, res) => {

    const request = req.body;
    const Login_name = request.Login_name;
    const Password = bcrypt.hashSync(request.Password, 10);
    const Phone_number = request.Phone_Number;
    const Email = request.email;
    const Hospital_id = mongoose.Types.ObjectId(request.Hospital_id);


    const exist_hospital_id = await Hospital.findOne({ _id: Hospital_id });
    if (exist_hospital_id == null) {
        return res.status(400).send({ status: status_code.Failed, Message: "Hospital id not exist" });
    }

    const newUser = new Doctor({
        Login_name,
        Password,
        Phone_number,
        Email,
        Hospital_id
    });

    const user = await Doctor.findOne({ Email: Email });

    if (user) {
        return res.status(400).send({ status: status_code.Failed, Message: "User exists already" });
    }

    await newUser.save().then((data) => {
        return res.status(200).send({ status: status_code.Success, Message: "Add user successfully" })
    }).catch((err) => {
        return res.status(400).send({ status: status_code.Failed, error: err.message })
    })
}

export const Login = async (req, res) => {

    const request = req.body;
    const Email = request.email;
    const Password = request.Password;

    const user = await Doctor.findOne({ Email: Email });
    if (!user) {
        return res.status(400).send({ status: status_code.Failed, Message: "User Not exist" });
    }
    if (user && bcrypt.compareSync(Password, user.Password)) {
        return res.status(200).send({ status: status_code.Success, user });
    } else {
        return res.status(404).send({ status: status_code.Failed, Message: "Wrong Password" });
    }
}

export const GetAllUser = async (req, res) => {

    const All_User = await Doctor.find({}, { Login_name: 1, _id: 0 });

    if (!All_User) {
        return res.status(500).send({ status: status_code.Failed, Message: "Server Error, no user display" });
    }

    return res.status(200).send({ status: status_code.Success, user_list: All_User });
}