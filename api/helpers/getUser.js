'use strict';
const { User } = require('../models/User');
const logger = require('../modules/logger');

module.exports = async function (id, fields) {
	if (fields && fields.length > 0) fields = fields.join(' ');
	let user;
	try {
		if (fields && fields.length > 0) {
			user = await User.findById(id).select(fields);
		} else {
			user = await User.findById(id);
		}
	} catch (e) {
		logger.log({
			level: 'error',
			message: 'failure in getUser helper db query',
		});
	}

	if (user) return user;
};
