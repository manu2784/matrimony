"use strict";
const mongoose = require("mongoose");
const { User } = require("../models/User");

const welcomeController = async (req, res) => {
  console.log("welcome controller");
  console.log(process.env.NODE_ENV);
  res.send(process.env.NODE_ENV);
};

module.exports = welcomeController;
