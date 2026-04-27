"use strict";

const { hashToken } = require("../helpers/hashToken");
const { RefreshToken } = require("../models/RefreshToken");
const {
  getAccessCookieOptions,
  getRefreshCookieOptions,
} = require("../helpers/authCookies");

module.exports = async function (req, res) {
  const token = req.cookies.refreshToken;
  if (!token) return res.sendStatus(204);

  await RefreshToken.deleteOne({
    tokenHash: hashToken(token),
  });

  res.clearCookie("refreshToken", getRefreshCookieOptions());
  res.clearCookie("accessToken", getAccessCookieOptions());
  res.sendStatus(204);
};
