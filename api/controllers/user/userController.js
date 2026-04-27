"use strict";
const { User } = require("../../models/User");
const logger = require("../../modules/logger");
const { buildAuthState } = require("../../helpers/buildAuthState");

module.exports = async function (req, res) {
  const { _id } = req.user || {};
  let user;

  try {
    user = await User.findOne({ _id: _id }).select("-password");
  } catch (e) {
    logger.log({
      level: "error",
      message: "failure in login controller",
    });
    res.status(500).send("server error");
    return;
  }

  if (!user) {
    res.status(404).send("user not found");
    return;
  }

  const authState = await buildAuthState(user);
  res.json(authState);
};
