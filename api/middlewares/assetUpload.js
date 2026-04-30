"use strict";

const multer = require("multer");
const { MAX_FILE_SIZE_BY_EXTENSION } = require("../config/assets");

const maxAssetUploadSize = Math.max(
  ...Object.values(MAX_FILE_SIZE_BY_EXTENSION),
);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: maxAssetUploadSize,
    files: 1,
  },
});

module.exports = upload.single("file");
