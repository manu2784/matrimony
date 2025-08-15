"use strict";
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
require("dotenv").config({ path: `.env.${process.env.NODE_ENV}` });

// simple schema
const UserSchema = new mongoose.Schema({
  firstName: {
    type: String,
    minlength: 3,
    maxlength: 50,
  },
  lastName: {
    type: String,
    minlength: 3,
    maxlength: 50,
  },
  email: {
    type: String,
    required: true,
    minlength: 5,
    maxlength: 255,
    unique: true,
  },
  password: {
    type: String,
    minlength: 3,
    maxlength: 255,
  },
  org: {
    type: mongoose.ObjectId,
  },
  accountManagerOrgs: {
    type: [mongoose.ObjectId],
  },
  rosters: {
    type: [mongoose.ObjectId],
  },
  status: String,
  teams: [mongoose.ObjectId],
  availability: Object,
  acceptedTC: Boolean,
  location: String,
  roles: [String],
  adminTeams: [mongoose.ObjectId],
  blocked: Boolean,
  phone: Number,
});

UserSchema.methods.isActive = function () {
  return this.status === "enabled";
};

//custom method to generate authToken
UserSchema.methods.generateAuthToken = function () {
  const token = jwt.sign(
    { _id: this._id, permission: this.permission, orgs: this.orgs },
    process.env.myprivatekey
  );
  return token;
};

const User = mongoose.model("User", UserSchema);

exports.User = User;
