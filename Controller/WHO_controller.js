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
		const grouped_dataObject = dataObject.reduce((resultArray, item, index) => {
			const chunkIndex = Math.floor(index / chunk);

			if (!resultArray[chunkIndex]) {
				resultArray[chunkIndex] = [];
			}

			resultArray[chunkIndex].push(item);

			return resultArray;
		}, []);

		const values = dataObject.map(d => {
			return d.value ? d.value : 0;
		});

		const max = Math.max(...values);
		const min = Math.min(...values);
		const sum = values.reduce((p, v) => p + v, 0);

		const mean =
			Math.round((values.reduce((acc, value) => acc + value, 0) / values.length) * 100) / 100;

		var variance = values.map(d => {
			const diff = d - mean;
			return diff * diff;
		});

		variance = variance.reduce((acc, value) => acc + value, 0) / variance.length;
		variance = Math.round(variance * 100) / 100;
		var standard_deviation = Math.sqrt(
			values
				.reduce((acc, value) => acc.concat((value - mean) ** 2), [])
				.reduce((acc, value) => acc + value, 0) / values.length
		);
		standard_deviation = Math.round(standard_deviation * 100) / 100;

		const Analytics = {
			max,
			min,
			sum,
			mean,
			standard_deviation,
			variance,
		};

		return res.status(200).send({
			status: status_code.Success,
			data: grouped_dataObject,
			Table_data: dataObject,
			Analytics,
		});
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

export const CompareData = async (req, res) => {
	const option = req.query.option;
	const targetCountry = req.query.targetCountry;
	const currentCountry = req.query.currentCountry;

	if (!option) {
		return res
			.status(400)
			.send({ status: status_code.Failed, Message: "option should not be empty" });
	}

	if (!targetCountry || !currentCountry) {
		return res.status(400).send({
			status: status_code.Failed,
			Message: "target country and current country should not be empty",
		});
	}
	var Indicator_Key = getIndicator_key(option);
	var Compare_data = await WHO.aggregate([
		{
			$match: {
				Indication_code: Indicator_Key,
				country_code: { $in: [currentCountry, targetCountry] },
			},
		},
		{
			$project: {
				data: 1,
				country_code: 1,
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
				country_code: 1,
				Year: "$data.Year",
				low: "$data.low",
				High: "$data.High",
				value: "$data.value",
			},
		},
	]);

	console.log(Compare_data);

	const compare_data_map = new Map();
	for (let i = 0; i < Compare_data.length; i++) {
		if (!compare_data_map.has(Compare_data[i].Year)) {
			compare_data_map.set(Compare_data[i].Year, [
				{ country_code: Compare_data[i].country_code, value: Compare_data[i].value },
			]);
		} else {
			var copy_data = compare_data_map.get(Compare_data[i].Year);
			copy_data.push({ country_code: Compare_data[i].country_code, value: Compare_data[i].value });
		}
	}

	let target_Data = [];
	let current_Data = [];

	for (const [key, value] of compare_data_map) {
		const targetCountryData = value.filter(v => v.country_code === targetCountry);
		const currentCountryData = value.filter(v => v.country_code === currentCountry);

		if (targetCountryData.length > 0) {
			target_Data.push({
				Year: key,
				value: targetCountryData[0].value ? targetCountryData[0].value : 0,
			});
		} else {
			target_Data.push({ Year: key, value: 0 });
		}

		if (currentCountryData.length > 0) {
			current_Data.push({
				Year: key,
				value: currentCountryData[0].value ? currentCountryData[0].value : 0,
			});
		} else {
			current_Data.push({ Year: key, value: 0 });
		}
	}

	const chunk = 5;
	target_Data = target_Data.reduce((resultArray, item, index) => {
		const chunkIndex = Math.floor(index / chunk);

		if (!resultArray[chunkIndex]) {
			resultArray[chunkIndex] = [];
		}

		resultArray[chunkIndex].push(item);

		return resultArray;
	}, []);

	current_Data = current_Data.reduce((resultArray, item, index) => {
		const chunkIndex = Math.floor(index / chunk);

		if (!resultArray[chunkIndex]) {
			resultArray[chunkIndex] = [];
		}

		resultArray[chunkIndex].push(item);

		return resultArray;
	}, []);

	return res.status(200).send({ status: status_code.Success, target_Data, current_Data });
};

function getIndicator_key(option) {
	for (var key in WHO_Indicator_code) {
		if (WHO_Indicator_code[key] === option) {
			return key;
		}
	}
	return null;
}
