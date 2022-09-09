import mongoose from "mongoose";
import Malaria from "../Model/Malaria.js";
import { WHO_Indicator_code, status_code } from "../Common/status_code.js";

const WHO = Malaria.WHO;

export const Preview = async (req, res) => {

  var Indication_code = await WHO.distinct("Indication_code");
  var keys = Indication_code.map((code) => {
    return WHO_Indicator_code[code];
  })

  if (keys == null || keys.length == 0) {
    return res.status(404).send({ status: status_code.Failed, Error: "WHO Indicator code is not working" });
  }

  return res.status(200).send({ status: status_code.Success, data: keys });
};
