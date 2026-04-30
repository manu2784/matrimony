"use strict";

const dotenv = require("dotenv");

dotenv.config();

if (process.env.NODE_ENV) {
  dotenv.config({ path: `.env.${process.env.NODE_ENV}` });
}

const s3Config = {
  bucket: process.env.S3_ASSET_BUCKET,
  region: process.env.AWS_REGION || process.env.S3_REGION || "us-east-1",
  presignedUrlExpiresInSeconds: Number(
    process.env.S3_PRESIGNED_URL_EXPIRES_IN_SECONDS || 900,
  ),
};

module.exports = s3Config;
