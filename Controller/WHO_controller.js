import mongoose from "mongoose";
import Malaria from "../Model/Malaria.js";
import { WHO_Indicator_code, status_code } from "../Common/status_code.js";

const WHO = Malaria.WHO;
const Country_code = Malaria.Country_code;

export const Preview = async (req, res) => {
	var Indication_code = await WHO.distinct("Indication_code");
	var keys = Indication_code.map(code => {
		return WHO_Indicator_code[code];
	});

	console.log("keys: ", keys);

	if (keys == null || keys.length == 0) {
		return res.status(404).send({
			status: status_code.Failed,
			Error: "WHO Indicator code is not working",
		});
	}

	return res.status(200).send({ status: status_code.Success, option: keys });
};

export const WHO_Data = async (req, res) => {
	const option = req.query.option;
	const selectcountry = req.query.selectcountry;

	var Indicator_Key = getIndicator_key(option);
	if (Indicator_Key) {
		var dataObject = await WHO.aggregate([
			{
				$match: {
					Indication_code: Indicator_Key,
					country_code: selectcountry,
				},
			},
			{
				$project: {
					data: 1,
					_id: 0,
				},
			},
			{
				$unwind: {
					path: "$data",
				},
			},
			{
				$sort: {
					"data.Year": 1,
				},
			},
			{
				$project: {
					Year: "$data.Year",
					low: "$data.low",
					High: "$data.High",
					value: "$data.value",
				},
			},
		]);

		const chunk = 5;
		dataObject = dataObject.reduce((resultArray, item, index) => {
			const chunkIndex = Math.floor(index / chunk);

			if (!resultArray[chunkIndex]) {
				resultArray[chunkIndex] = [];
			}

			resultArray[chunkIndex].push(item);

			return resultArray;
		}, []);
		return res.status(200).send({ status: status_code.Success, data: dataObject });
	} else {
		return res.status(401).send({ status: status_code.Failed, Message: "No Indicator code" });
	}
};

export const GetCountries = async (req, res) => {
	var countries = await Country_code.find({}, { _id: 0, Options: 1, code: 1, country_name: 1 });
	if (countries == null || countries.length === 0) {
		return res.status(401).send({ status: status_code.Failed, Message: "countries is not valid" });
	} else {
		countries = countries.map(data => {
			return { code: data.code, Options: data.Options };
		});
		return res.status(200).send({ status: status_code.Success, countries });
	}
};

function getIndicator_key(option) {
	for (var key in WHO_Indicator_code) {
		if (WHO_Indicator_code[key] === option) {
			return key;
		}
	}
	return null;
}
