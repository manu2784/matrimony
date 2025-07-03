'use strict';
const getUser = require('../helpers/getUser');
const resourcePrevileges = require('../modules/resourcePrevileges');

module.exports = function (resource) {
	return async function (req, res, next) {
		if (resource === 'user') {
			const targetUser = await getUser(req.body._id);
			const fieldsToUpdate = Object.keys(req.body).filter((field) => field !== '_id');

			if (req.user.role === 1) {
				return next();
			}

			if (req.body._id && req.body._id === req.user._id) {
				let allFieldsAllowed = fieldsToUpdate.every((field) => resourcePrevileges.user.user.includes(field));
				if (allFieldsAllowed) return next();
			}

			if (req.user.role === 4) {
				let allFieldsAllowed = fieldsToUpdate.every((field) => resourcePrevileges.user.teamAdmin.includes(field));
				if (allFieldsAllowed && targetUser.org === req.user.org) return next();
			}

			if (req.user.role === 3) {
				let allFieldsAllowed = fieldsToUpdate.every((field) => resourcePrevileges.user.companyAdmin.includes(field));
				if (allFieldsAllowed && targetUser.org === req.user.org) return next();
			}

			if (req.user.role === 2) {
				let allFieldsAllowed = fieldsToUpdate.every((field) => resourcePrevileges.user.accountManager.includes(field));
				if (req.user.org.includes(targetUser.org)) return next();
			}
		}
		res.status(403).send('not allowed');
	};
};
