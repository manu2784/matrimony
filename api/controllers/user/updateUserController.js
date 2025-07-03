"use strict";

const { User } = require("../../models/User");
const validateUser = require("../../modules/validations/validateUser");
const bcrypt = require("bcrypt");

exports.updateUserController = async (req, res) => {
  const { error } = validateUser(req.body, Object.keys(req.body));
  if (error) return res.status(400).send(error.details[0].message);

  //fields not applicable to updates
  delete req.body.accountManagerOrgs;
  delete req.body.adminTeams;
  delete req.body.permission;
  delete req.body.org;

  // find an existing user
  let existingUser;
  try {
    existingUser = await User.findById(req.body._id);
    //  existingUser= existingUser.toObject();
  } catch (e) {
    console.log(e);
  }
  if (!existingUser) return res.status(404).send("User not found");

  const props = Object.keys(User.schema.paths);
  for (let i = 0; i < props.length; i++) {
    let key = props[i];
    if (key === "_id") continue;

    if (req.body[key]) existingUser[key] = req.body[key];
  }
  delete existingUser.__v;
  if (req.body.password)
    existingUser.password = await bcrypt.hash(existingUser.password, 10);

  res.send(await existingUser.save());
};
