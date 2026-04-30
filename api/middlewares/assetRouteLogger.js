"use strict";

const logger = require("../modules/logger");

function assetRouteLogger(req, res, next) {
  const start = Date.now();
  const requestMeta = {
    method: req.method,
    path: req.originalUrl,
    userId: req.user?._id || null,
    ip: req.ip,
  };

  logger.info("asset route request started", requestMeta);

  res.on("finish", () => {
    logger.info("asset route request finished", {
      ...requestMeta,
      statusCode: res.statusCode,
      durationMs: Date.now() - start,
    });
  });

  next();
}

module.exports = assetRouteLogger;
