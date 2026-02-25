"use strict";
const bcrypt = require("bcrypt");
const { User } = require("../models/User");
const logger = require("../modules/logger");
const { hashToken } = require("../helpers/hashToken");
const { RefreshToken } = require("../models/RefreshToken");

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: false,
  sameSite: "lax",
  path: "/",
};
module.exports = async function (req, res) {
  const { email, password } = req.body;
  let match, user;

  try {
    user = await User.findOne({ email: email.trim().toLowerCase() });

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

  const acessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();

  await RefreshToken.create({
    userId: user._id,
    tokenHash: hashToken(refreshToken),
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  });

  res.cookie("refreshToken", refreshToken, {
    ...COOKIE_OPTIONS,
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });

  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.send(acessToken);
};
