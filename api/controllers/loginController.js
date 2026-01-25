"use strict";
const bcrypt = require("bcrypt");
const { User } = require("../models/User");
const logger = require("../modules/logger");

module.exports = async function (req, res) {
  const { email, password } = req.body;
  let match, user;
  try {
    user = await User.findOne({ email });
    if (user) match = await bcrypt.compare(password, user.password);
  } catch (e) {
    logger.log({
      level: "error",
      message: "failure in login controller",
    });
    res.status(500).send("server error");
  }

  if (!match || !user || !user.isActive()) {
    res.status(403).send("incorrect credentials");
    return;
  }

  const token = user.generateAuthToken();
  // res.header('x-auth-token', token).send();
  res.send(token);
};
