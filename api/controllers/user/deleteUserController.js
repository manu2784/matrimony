"use strict";

const mongoose = require("mongoose");
const { User } = require("../../models/User");
const { Permission } = require("../../models/Permission");

exports.deleteUserController = async (req, res) => {
  const userId = req.body?._id;

  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).send("invalid user id");
  }

  // find an existing user
  let user;
  try {
    user = await User.findOne({ _id: userId });
  } catch (e) {
    return res.status(500).send(e.message || "unable to load user");
  }
  if (!user) return res.status(400).send("user not found");

  try {
    await Permission.deleteMany({ userId: user._id });
    await user.deleteOne();
  } catch (e) {
    return res.status(500).send(e.message || "unable to delete user");
  }

  return res.status(200).send("user deleted");
};
