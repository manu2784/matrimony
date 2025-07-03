'use strict';
const bcrypt = require('bcrypt');
const { User } = require('../models/User');
const logger = require('../modules/logger');
const Org = require('../models/Org');
const Team = require('../models/Team');
const mongoose = require('mongoose');
const { addAccountManager, removeAccountManager } = require('../helpers/accountManagerPermission');
const { addTeamAdmin, removeTeamAdmin } = require('../helpers/teamAdminPermission');

module.exports = async function (req, res) {
	let user = await User.findById(req.body._id);

	if (user.org && req.body.org && user.org !== req.body.org) return res.status(400).send();
	let oldPermission = user.permission;
	let permission = req.body.permission;

	if (permission === 1 && req.user.permission === 1) {
		user.permission = 1;
		try {
			await user.save();
		} catch (e) {
			return res.status(500).send("can't update permissions");
		}
		return res.status(200).send('permissions update');
	}

	let orgsAdded, orgsRemoved;
	if (permission === 2) {
		// removing orgs from account manager
		if (oldPermission === 2 && req.body.removedAccountManagerOrgs && req.body.removedAccountManagerOrgs.length > 0) {
			orgsRemoved = await removeAccountManager(user, req.body.removedAccountManagerOrgs);
		}
		// adding orgs to account manager
		if (oldPermission === 2 && req.body.addedAccountManagerOrgs && req.body.addedAccountManagerOrgs.length > 0) {
			orgsAdded = await addAccountManager(user, req.body.addedAccountManagerOrgs);
		}

		if (permission !== 2 && req.body.addedAccountManagerOrgs && req.body.addedAccountManagerOrgs.length > 0) {
			user.permission = 2;
			orgsAdded = await addAccountManager(user, req.body.addedAccountManagerOrgs);
		}
		if (!(orgsAdded || orgsRemoved)) return res.status(500).send("can't update permissions");
		return res.status(200).send('permissions updated');
	}

	if (permission === 4) {
		let teamsAdded, teamsRemoved;
		if (
			(!req.body.removedAdminTeams || req.body.removedAdminTeams.length < 0) &&
			(!req.body.addedAdminTeams || req.body.addedAdminTeams.length < 0)
		)
			return res.status(400).send('incorrect data');

		// removing teams from team admins
		if (oldPermission === 4 && req.body.removedAdminTeams && req.body.removedAdminTeams.length > 0) {
			teamsRemoved = await removeTeamAdmin(user, req.body.removedAdminTeams);
		}

		// adding teams to team admins
		if (oldPermission === 4 && req.body.addedAdminTeams && req.body.addedAdminTeams.length > 0) {
			teamsAdded = await addTeamAdmin(user, req.body.addedAdminTeams);
		}

		if (oldPermission !== 4 && req.body.addedAdminTeams && req.body.addedAdminTeams.length > 0) {
			user.permission = 4;
			teamsAdded = await addTeamAdmin(user, req.body.addedAdminTeams);
		}

		if (!teamsRemoved && !teamsAdded) return res.status(500).send("can't teams update permissions");
		return res.status(200).send('teams permissions update');
	}

	if (permission === 3 && user.org) {
		user.permission = 3;
		user.adminTeams = [];
		try {
			await Promise.all([
				user.save(),
				Org.findByIdAndUpdate(user.org, {
					$addToSet: { companyAdmins: user._id },
				}),
			]);
		} catch (e) {
			return res.status(500).send("can't update permissions");
		}

		return res.status(200).send('permissions update');
	}
};
