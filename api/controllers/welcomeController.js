"use strict";
const mongoose = require("mongoose");
const { User } = require("../models/User");

const welcomeController = async (req, res) => {
  console.log(process.env.NODE_ENV);
  res.send("Mallesh Ashnikar");
};

module.exports = welcomeController;
