"use strict";

const mongoose = require("mongoose");
const Asset = require("../../models/Asset");
const s3Config = require("../../config/s3");
const logger = require("../../modules/logger");
const {
  S3AssetServiceError,
  buildAssetKey,
  createPresignedDownloadUrl,
  createPresignedUploadUrl,
} = require("../../services/s3AssetService");

function handlePresignedError(res, error, context) {
  logger.error("asset presigned url failed", {
    context,
    message: error.message,
    code: error.code,
    stack: error.stack,
  });

  const isAssetStorageError =
    error instanceof S3AssetServiceError ||
    error.name === "CredentialsProviderError" ||
    error.message?.includes("Could not load credentials");

  if (isAssetStorageError) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }

  return res.status(500).json({
    success: false,
    message: "Internal server error",
  });
}

exports.createAssetUploadUrlController = async (req, res) => {
  try {
    const { instituteId, courseId, originalFileName, fileName, mimeType } =
      req.body;
    const name = originalFileName || fileName;

    if (!instituteId || !name) {
      return res.status(400).json({
        success: false,
        message: "instituteId and originalFileName are required",
      });
    }

    const objectIdFields = {
      instituteId,
      ownerId: req.user?._id,
    };

    if (courseId) {
      objectIdFields.courseId = courseId;
    }

    for (const [field, value] of Object.entries(objectIdFields)) {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        return res.status(400).json({
          success: false,
          message: `Invalid ${field} format`,
        });
      }
    }

    const key = buildAssetKey({
      instituteId,
      courseId,
      ownerId: req.user._id,
      fileName: name,
    });

    const uploadUrl = await createPresignedUploadUrl({
      key,
      contentType: mimeType,
    });

    return res.status(201).json({
      success: true,
      data: {
        uploadUrl,
        bucket: s3Config.bucket,
        key,
        region: s3Config.region,
        expiresInSeconds: s3Config.presignedUrlExpiresInSeconds,
        inferredType: req.assetFile.inferredType,
        maxSizeBytes: req.assetFile.maxSizeBytes,
      },
    });
  } catch (error) {
    return handlePresignedError(res, error, {
      action: "createAssetUploadUrl",
      userId: req.user?._id || null,
      instituteId: req.body?.instituteId || null,
      courseId: req.body?.courseId || null,
    });
  }
};

exports.createAssetDownloadUrlController = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid asset id format",
      });
    }

    const asset = await Asset.findById(id);

    if (!asset) {
      return res.status(404).json({
        success: false,
        message: "Asset not found",
      });
    }

    const downloadUrl = await createPresignedDownloadUrl({
      key: asset.s3.key,
    });

    return res.status(200).json({
      success: true,
      data: {
        downloadUrl,
        expiresInSeconds: s3Config.presignedUrlExpiresInSeconds,
      },
    });
  } catch (error) {
    return handlePresignedError(res, error, {
      action: "createAssetDownloadUrl",
      userId: req.user?._id || null,
      assetId: req.params?.id || null,
    });
  }
};
