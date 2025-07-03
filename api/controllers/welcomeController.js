'use strict';
const mongoose = require('mongoose');
const { User } = require('../models/User');

const welcomeController = async (req, res) => {
	let user = new User({
		name: 'MAllesh',
		password: 'req.body.password',
		email: 'jhsdhjkf@bkj.com',
	});
	// user.password = await bcrypt.hash(user.password, 10);
	//   try {
	//       await user.save();
	//   }catch(e){
	//       console.log("ERROÖ", e);
	//   }
	res.send('Server is running.....');
};

module.exports = welcomeController;
