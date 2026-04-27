"use strict";

const jwt = require("jsonwebtoken");

module.exports = function optionalAuthentication(req, res, next) {
  const authHeader = req.headers["authorization"];
  const accessTokenHeader = req.headers["x-access-token"];

  let token = null;

  if (typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  } else if (typeof accessTokenHeader === "string" && accessTokenHeader) {
    token = accessTokenHeader;
  } else if (
    typeof req.cookies?.accessToken === "string" &&
    req.cookies.accessToken
  ) {
    token = req.cookies.accessToken;
  }

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.myprivatekey);
    req.user = decoded;
  } catch (error) {
    return res.status(400).send("Invalid token.");
  }

  return next();
};
