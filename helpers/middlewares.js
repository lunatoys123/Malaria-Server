import { status_code } from "../Common/status_code.js";
import Malaria from "../Model/Malaria.js";

const Doctor = Malaria.Doctor;
export const checkAdminRight = async (req, res, next) => {
	const Doctor_id = req.query.Doctor_id;

	const doctor = await Doctor.findOne({ _id: Doctor_id }, {});
	//console.log(doctor);
	if (doctor.Role !== "CA") {
		return res.status(404).send({ status: status_code.Failed, Message: "Not authorized" });
	}
	next();
};
