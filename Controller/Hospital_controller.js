import Malaria from "../Model/Malaria.js";
import { status_code } from "../Common/status_code.js";

const Hospital = Malaria.Hospital;
const Country_code = Malaria.Country_code;

export const RegisterHosptial = async (req, res) => {
  const request = req.body;
  const name = request.name;
  const Region = request.Region;
  const Location = request.Location;
  const Phone_number = request.Phone_Number;

  var new_hospital = new Hospital({
    name,
    Location,
    Region,
    createBy: "Admin",
    Phone_number,
  });
  const exist_hospital = await Hospital.findOne({ name, Region });

  if (exist_hospital) {
    return res
      .status(200)
      .send({ status: status_code.Failed, Message: "Hospital already exists" });
  }
  await new_hospital
    .save()
    .then((data) => {
      return res
        .status(200)
        .send({ status: status_code.Success, Message: "Hospital Created" });
    })
    .catch((err) => {
      return res
        .status(400)
        .send({ status: status_code.Failed, error: err.message });
    });
};

export const findAllRegion = async (req, res) => {
  var regions = await Country_code.find({}).sort({ code: 1 });

  if (regions == null || regions.length == 0) {
    return res
      .status(404)
      .send({ status: status_code.Failed, Message: "Region list is empty" });
  }
  regions = regions.map((obj) => {
    return { code: obj.code, Options: obj.Options };
  });

  return res.status(200).send({ status: status_code.Success, regions });
};

export const findAllHospital = async (req, res) => {
  var All_Hospital = await Hospital.find({}, { name: 1 });
  return res
    .status(200)
    .send({ status: status_code.Success, Hospital: All_Hospital });
};
