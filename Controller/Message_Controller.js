import Malaria from "../Model/Malaria.js";
import { status_code } from "../Common/status_code.js";

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
			status: "unread",
			createBy: login_name,
		});
	}

	const Message_Object = await Message.insertMany(Message_Stack).catch(err => {
		return res.status(400).send({ status: status_code.Failed, Error: err });
	});

	if (Message_Object) {
		console.log("Send Message Successfully");
	}
};
