"use strict";
const { User } = require("../../models/User");
const logger = require("../../modules/logger");

module.exports = async function (req, res) {
  const { _id } = req.body;
  let match, user;

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
    res.status(403).send("incorrect credentials");
    return;
  }
  res.json(user);
};
