'use strict';
const mongoose = require('mongoose');
const logger = require('../modules/logger');
const Team = require('../models/Team');

const addTeamAdmin = async function (user, newTeams) {
	let count = await Team.count({ _id: { $in: newTeams }, org: user.org });
	if (count !== newTeams.length) return false;

	let adminTeamsIds = user.adminTeams.map((objectId) => objectId.toString());
	adminTeamsIds = [...new Set([...adminTeamsIds, ...newTeams])];
	user.adminTeams = adminTeamsIds.map((id) => mongoose.Types.ObjectId(id));
	// To do - need to check if the teams belong to same org as users
	let addedTeams = newTeams.map((team) => {
		return {
			updateOne: {
				filter: { _id: team },
				update: { $addToSet: { teamAdmins: user._id } },
			},
		};
	});

	return await savePermissions(user, addedTeams);
};

const removeTeamAdmin = async function (user, removedTeams) {
	user.adminTeams = user.adminTeams.filter((team) => {
		return !removedTeams.includes(team.toString());
	});
	if (user.adminTeams.length === 0 && user.permission !== 0) {
		user.permission = 0;
	}
	let removedAdminTeams = removedTeams.map((team) => {
		return {
			updateOne: {
				filter: { _id: team },
				update: { $pull: { teamAdmins: user._id } },
			},
		};
	});
	return await savePermissions(user, removedAdminTeams);
};

const savePermissions = async function (user, changedTeams) {
	try {
		// bulkwrite doesn't throw error when any of the doc doesn't exist, it should
		await Promise.all([user.save(), Team.bulkWrite(changedTeams)]);
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
	addTeamAdmin,
	removeTeamAdmin,
};
