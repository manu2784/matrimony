'use strict';
require('dotenv').config();
const mongoose = require('mongoose');

const url =
	'mongodb+srv://' +
	process.env.db_username +
	':' +
	process.env.db_password +
	'@cluster0.fuute.mongodb.net/appoint-mate?retryWrites=true&w=majority';

const dbConnect = () => {
	return mongoose.connect(url, {
		useNewUrlParser: true,
		useUnifiedTopology: true,
	});
};

module.exports = dbConnect;
