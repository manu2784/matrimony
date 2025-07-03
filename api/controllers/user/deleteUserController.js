"use strict";

const { User } = require("../../models/User");

exports.deleteUserController = async (req, res) => {
  // find an existing user
  let user;
  try {
    user = await User.findOne({ _id: req.body._id });
  } catch (e) {
    console.log(e);
  }
  if (!user) return res.status(400).send("user not found");

  try {
    let result = await user.deleteOne();
    console.log(result);
  } catch (e) {
    return res.status(500).send(e);
  }
  if (result && result._id) {
    res.status(200).send("user deleted");
  } else res.status(500).send("can't delete user");
};
