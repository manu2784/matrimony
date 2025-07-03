'use strict';
const mongoose = require('mongoose');
const logger = require('../modules/logger');
const Org = require('../models/Org');

const addAccountManager = async function (user, newOrgs) {
	let accountManagerIds = user.accountManagerOrgs.map((objectId) => objectId.toString());
	accountManagerIds = [...new Set([...accountManagerIds, ...newOrgs])];
	user.accountManagerOrgs = accountManagerIds.map((id) => mongoose.Types.ObjectId(id));
	let addedOrgs = newOrgs.map((org) => {
		return {
			updateOne: {
				filter: { _id: org },
				update: { $addToSet: { accountManagers: user._id } },
			},
		};
	});

	return await savePermissions(user, addedOrgs);
};

const removeAccountManager = async function (user, removedOrgs) {
	user.accountManagerOrgs = user.accountManagerOrgs.filter((org) => {
		return !removedOrgs.includes(org.toString());
	});
	let orgsRemoved = removedOrgs.map((org) => {
		return {
			updateOne: {
				filter: { _id: org },
				update: { $pull: { accountManagers: user._id } },
			},
		};
	});
	return await savePermissions(user, orgsRemoved);
};

const savePermissions = async function (user, changedOrgs) {
	try {
		// bulwrite doesn't throw error when any of the doc doesn't exist, it should
		await Promise.all([user.save(), Org.bulkWrite(changedOrgs)]);
	} catch (e) {
		logger.log({
			level: 'error',
			message: e,
		});
		return false;
	}
	return true;
};

module.exports = {
	addAccountManager,
	removeAccountManager,
};
