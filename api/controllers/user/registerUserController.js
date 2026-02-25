"use strict";

const { User } = require("../../models/User");
const validateUser = require("../../modules/validations/validateUser");
const bcrypt = require("bcrypt");
const { existingUser } = require("../../helpers/userUtils");

exports.registerUserController = async (req, res) => {
  // validate the request body first
  const { error } = validateUser(req.body);
  if (error) return res.status(400).send(error.details[0].message);
  // find an existing user
  if (await existingUser("email", req.body.email))
    return res.status(400).send("User already registered.");
  let user;
  user = new User(req.body);

  if (user.password) user.password = await bcrypt.hash(user.password, 10);

  user.status = "enabled";
  await user.save();

  // (update team db)
  if (!user.isActive()) {
    return res.send({
      _id: user._id,
      email: user.email,
    });
  }

  const token = user.generateAccessToken();
  res.header("x-auth-token", token).send({
    _id: user._id,
    email: user.email,
  });
};
