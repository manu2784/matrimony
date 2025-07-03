'use strict';
const { User } = require('../models/User');
const bcrypt = require('bcrypt');

exports.createUser = async function (userObj) {
	let user;
	// find an existing user
	try {
		user = await User.findOne({ email: userObj.email });
	} catch (e) {
		console.log(e);
	}
	if (user) return false;

	user = new User(req.body);

	if (user.password) user.password = await bcrypt.hash(user.password, 10);
	return await user.save();
};
