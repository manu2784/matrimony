"use strict";

const { hashToken } = require("../helpers/hashToken");
const { RefreshToken } = require("../models/RefreshToken");

module.exports = async function (req, res) {
  const token = req.cookies.refreshToken;
  if (!token) return res.sendStatus(204);

  await RefreshToken.deleteOne({
    tokenHash: hashToken(token),
  });

  res.clearCookie("refreshToken");
  res.sendStatus(204);
};
