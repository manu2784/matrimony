"use strict";

const path = require("path");
const s3Config = require("../config/s3");

let awsModules = null;

class S3AssetServiceError extends Error {
  constructor(message, statusCode = 503, code = "S3_ASSET_SERVICE_ERROR") {
    super(message);
    this.name = "S3AssetServiceError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

function getAwsModules() {
  if (awsModules) return awsModules;

  try {
    awsModules = {
      ...require("@aws-sdk/client-s3"),
      ...require("@aws-sdk/s3-request-presigner"),
    };
    return awsModules;
  } catch (error) {
    throw new S3AssetServiceError(
      "AWS SDK dependencies are missing. Install @aws-sdk/client-s3 and @aws-sdk/s3-request-presigner.",
      500,
      "AWS_SDK_MISSING",
    );
  }
}

function assertBucketConfigured() {
  if (!s3Config.bucket) {
    throw new S3AssetServiceError(
      "S3_ASSET_BUCKET is not configured",
      503,
      "S3_BUCKET_NOT_CONFIGURED",
    );
  }
}

function getClient() {
  const { S3Client } = getAwsModules();
  return new S3Client({ region: s3Config.region });
}

function buildAssetKey({ instituteId, courseId, ownerId, fileName }) {
  const extension = path.extname(fileName).toLowerCase();
  const safeName = path
    .basename(fileName, extension)
    .replace(/[^a-z0-9-_]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
  const segments = ["institutes", instituteId];

  if (courseId) {
    segments.push("courses", courseId);
  }

  segments.push("assets", ownerId, `${Date.now()}-${safeName}${extension}`);
  return segments.join("/");
}

async function createPresignedUploadUrl({ key, contentType }) {
  assertBucketConfigured();
  const { PutObjectCommand, getSignedUrl } = getAwsModules();
  const command = new PutObjectCommand({
    Bucket: s3Config.bucket,
    Key: key,
    ContentType: contentType,
  });

  return getSignedUrl(getClient(), command, {
    expiresIn: s3Config.presignedUrlExpiresInSeconds,
  });
}

async function uploadAssetObject({ key, body, contentType }) {
  assertBucketConfigured();
  const { PutObjectCommand } = getAwsModules();
  const command = new PutObjectCommand({
    Bucket: s3Config.bucket,
    Key: key,
    Body: body,
    ContentType: contentType,
  });

  return getClient().send(command);
}

async function createPresignedDownloadUrl({ key }) {
  assertBucketConfigured();
  const { GetObjectCommand, getSignedUrl } = getAwsModules();
  const command = new GetObjectCommand({
    Bucket: s3Config.bucket,
    Key: key,
  });

  return getSignedUrl(getClient(), command, {
    expiresIn: s3Config.presignedUrlExpiresInSeconds,
  });
}

async function deleteAssetObject({ key }) {
  assertBucketConfigured();
  const { DeleteObjectCommand } = getAwsModules();
  const command = new DeleteObjectCommand({
    Bucket: s3Config.bucket,
    Key: key,
  });

  return getClient().send(command);
}

module.exports = {
  S3AssetServiceError,
  buildAssetKey,
  createPresignedDownloadUrl,
  createPresignedUploadUrl,
  deleteAssetObject,
  uploadAssetObject,
};
