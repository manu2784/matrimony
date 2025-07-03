const { User } = require('../models/User');

const existingUser = async (propKey, value) => {
	// find an existing user
	let user;
	try {
		user = await User.findOne({ [propKey]: value });
	} catch (e) {
		console.log(e);
	}

	return !!user;
};

exports.existingUser = existingUser;
