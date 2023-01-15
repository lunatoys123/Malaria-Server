import Malaria from "../Model/Malaria.js";
import { status_code, Message_status } from "../Common/status_code.js";
import mongoose from "mongoose";

const Message = Malaria.Message;

export const SendMessageToUser = async (req, res) => {
	const User_Message = req.body.Message;
	const Receipents = User_Message.Receipents;
	const Message_title = User_Message.Message_title;
	const Message_Content = User_Message.Message_Content;

	const login_name = req.body.login_name;

	var Message_Stack = [];

	for (let i = 0; i < Receipents.length; i++) {
		const Doctor_id = Receipents[i];
		Message_Stack.push({
			Doctor_id,
			Message_title,
			Message_Content,
			status: Message_status.unread,
			createdBy: login_name,
		});
	}

	const Message_Object = await Message.insertMany(Message_Stack).catch(err => {
		return res.status(400).send({ status: status_code.Failed, Error: err });
	});

	if (Message_Object) {
		return res
			.status(200)
			.send({ status: status_code.Success, Message: "Send Message Successfully" });
	}
};

export const GetMessageForUser = async (req, res) => {
	var Doctor_id = req.query.Doctor_Id;

	if (!mongoose.Types.ObjectId.isValid(Doctor_id)) {
		return res.status(404).send({
			status: status_code.Failed,
			Error: "Doctor id format is not valid",
		});
	}

	const Message_Object = await Message.find(
		{ Doctor_id: Doctor_id },
		{ Message_title: 1, Message_Content: 1, status: 1, createdBy: 1, dtCreated: 1 }
	).catch(err => {
		return res.status(400).send({ status: status_code.Failed, Error: err });
	});

	return res.status(200).send({ Message_Object: Message_Object });
};

export const SetReadStateForMessage = async (req, res) => {
	const Message_Id = req.body.MessageId;

	if (!mongoose.Types.ObjectId.isValid(Message_Id)) {
		return res.status(404).send({
			status: status_code.Failed,
			Error: "Message id format is not valid",
		});
	}

	const Message_object = await Message.findOneAndUpdate(
		{ _id: Message_Id },
		{
			status: Message_status.read,
		}
	).catch(err => {
		return res.status(400).send({ status: status_code.Failed, Error: err });
	});

	if (Message_object) {
		return res.status(200).send({ status: status_code.OK, Message: "Message status updated" });
	}
};

export const getUnreadCount = async (req, res) => {
	const Doctor_id = req.query.Doctor_Id;

	if (!mongoose.Types.ObjectId.isValid(Doctor_id)) {
		return res.status(404).send({
			status: status_code.Failed,
			Error: "Doctor id format is not valid",
		});
	}

	const unreadCount = await Message.find({
		Doctor_id: Doctor_id,
		status: Message_status.unread,
	})
		.count()
		.catch(err => {
			return res.status(404).send({ status: status_code.Failed, Error: err });
		});

	return res.status(200).send({ unreadCount: unreadCount });
};
