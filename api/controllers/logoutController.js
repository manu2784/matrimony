"use strict";
const bcrypt = require("bcrypt");
const { User } = require("../models/User");
const logger = require("../modules/logger");

module.exports = async function (req, res) {
  res.clearCookie("token", {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
  });

  res.json({ message: "Logged out successfully" });
};
