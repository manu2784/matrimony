"use strict";

const mongoose = require("mongoose");
const Asset = require("../../models/Asset");
const s3Config = require("../../config/s3");
const logger = require("../../modules/logger");
const {
  S3AssetServiceError,
  buildAssetKey,
  uploadAssetObject,
} = require("../../services/s3AssetService");

function handleUploadError(res, error, context) {
  logger.error("asset upload failed", {
    context,
    message: error.message,
    code: error.code,
    stack: error.stack,
  });

  if (
    error instanceof S3AssetServiceError ||
    error.name === "CredentialsProviderError" ||
    error.message?.includes("Could not load credentials")
  ) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }

  if (error.name === "ValidationError") {
    const errors = Object.values(error.errors).map((err) => err.message);
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors,
    });
  }

  if (error.code === 11000) {
    return res.status(409).json({
      success: false,
      message: "Asset already exists",
    });
  }

  return res.status(500).json({
    success: false,
    message: "Internal server error",
  });
}

exports.uploadAssetController = async (req, res) => {
  try {
    const { title, description, instituteId, courseId, moduleId, lessonId } =
      req.body;

    if (!title || !instituteId || !req.file) {
      return res.status(400).json({
        success: false,
        message: "title, instituteId and file are required",
      });
    }

    const objectIdFields = {
      instituteId,
      ownerId: req.user?._id,
    };

    if (courseId) {
      objectIdFields.courseId = courseId;
    }
    if (moduleId) {
      objectIdFields.moduleId = moduleId;
    }
    if (lessonId) {
      objectIdFields.lessonId = lessonId;
    }

    for (const [field, value] of Object.entries(objectIdFields)) {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        return res.status(400).json({
          success: false,
          message: `Invalid ${field} format`,
        });
      }
    }

    if ((moduleId || lessonId) && !courseId) {
      return res.status(400).json({
        success: false,
        message: "courseId is required when moduleId or lessonId is provided",
      });
    }

    if (lessonId && !moduleId) {
      return res.status(400).json({
        success: false,
        message: "moduleId is required when lessonId is provided",
      });
    }

    const key = buildAssetKey({
      instituteId,
      courseId,
      ownerId: req.user._id,
      fileName: req.file.originalname,
    });

    await uploadAssetObject({
      key,
      body: req.file.buffer,
      contentType: req.file.mimetype || "application/octet-stream",
    });

    const asset = await Asset.create({
      title,
      description: description || undefined,
      type: req.assetFile.inferredType,
      instituteId,
      courseId: courseId || null,
      moduleId: moduleId || null,
      lessonId: lessonId || null,
      ownerId: req.user._id,
      s3: {
        bucket: s3Config.bucket,
        key,
        region: s3Config.region,
      },
      originalFileName: req.file.originalname,
      mimeType: req.file.mimetype || "application/octet-stream",
      sizeBytes: req.file.size,
    });

    return res.status(201).json({
      success: true,
      message: "Asset uploaded successfully",
      data: asset,
    });
  } catch (error) {
    return handleUploadError(res, error, {
      action: "uploadAsset",
      userId: req.user?._id || null,
      instituteId: req.body?.instituteId || null,
      courseId: req.body?.courseId || null,
      moduleId: req.body?.moduleId || null,
      lessonId: req.body?.lessonId || null,
      fileName: req.file?.originalname || null,
    });
  }
};
