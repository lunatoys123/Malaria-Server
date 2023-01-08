import { status_code, Account_status } from "../Common/status_code.js";
import { Admin_Role } from "../Common/role.js";
import Malaria from "../Model/Malaria.js";

const Doctor = Malaria.Doctor;
export const checkAdminRight = async (req, res, next) => {
	console.log(req.method);
	var Doctor_id = "";
	if (req.method == "POST") {
		Doctor_id = req.body.Doctor_id;
	}else if(req.method == "GET"){
		Doctor_id = req.query.Doctor_id;
	}

	// console.log(Doctor_id);
	const doctor = await Doctor.findOne({ _id: Doctor_id }, {});
	//console.log(doctor);
	if (doctor.Role !== Admin_Role) {
		return res.status(404).send({ status: status_code.Failed, Message: "Not authorized" });
	} else if (doctor.Account_status === Account_status.Pending) {
		return res.status(404).send({ status: status_code.Failed, Message: "Not authorized" });
	}
	next();
};
