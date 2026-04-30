"use strict";

const path = require("path");
const {
  ALLOWED_FILE_EXTENSIONS,
  ASSET_TYPE_BY_EXTENSION,
  MAX_FILE_SIZE_BY_EXTENSION,
} = require("../config/assets");

function getAssetFileName(req) {
  return (
    req.file?.originalname ||
    req.file?.filename ||
    req.body?.originalFileName ||
    req.body?.fileName ||
    req.body?.filename ||
    req.body?.s3?.key
  );
}

function getAssetFileSize(req) {
  const size = req.file?.size ?? req.body?.sizeBytes;
  return size === undefined || size === null ? null : Number(size);
}

function validateAssetFile(req, res, next) {
  const fileName = getAssetFileName(req);

  if (!fileName || typeof fileName !== "string") {
    return res.status(400).json({
      success: false,
      message: "A file name or originalFileName is required",
    });
  }

  const extension = path.extname(fileName).toLowerCase();

  if (!ALLOWED_FILE_EXTENSIONS.includes(extension)) {
    return res.status(400).json({
      success: false,
      message: "File extension is not allowed",
      allowedExtensions: ALLOWED_FILE_EXTENSIONS,
    });
  }

  const sizeBytes = getAssetFileSize(req);
  const maxSizeBytes = MAX_FILE_SIZE_BY_EXTENSION[extension];

  if (!Number.isFinite(sizeBytes) || sizeBytes <= 0) {
    return res.status(400).json({
      success: false,
      message: "sizeBytes is required and must be a positive number",
    });
  }

  if (sizeBytes > maxSizeBytes) {
    return res.status(413).json({
      success: false,
      message: "File size exceeds the allowed limit",
      extension,
      maxSizeBytes,
    });
  }

  req.assetFile = {
    extension,
    inferredType: ASSET_TYPE_BY_EXTENSION[extension],
    maxSizeBytes,
    sizeBytes,
  };

  next();
}

module.exports = validateAssetFile;
