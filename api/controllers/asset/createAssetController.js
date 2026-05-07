"use strict";

const mongoose = require("mongoose");
const Asset = require("../../models/Asset");
const s3Config = require("../../config/s3");
const logger = require("../../modules/logger");

exports.createAssetController = async (req, res) => {
  try {
    const {
      title,
      description,
      type,
      instituteId,
      courseId,
      moduleId,
      lessonId,
      s3,
      originalFileName,
      mimeType,
      sizeBytes,
      status,
    } = req.body;

    if (!title || !instituteId || !s3?.key) {
      return res.status(400).json({
        success: false,
        message: "title, instituteId and s3.key are required",
      });
    }

    const s3Bucket = s3.bucket || s3Config.bucket;

    if (!s3Bucket) {
      return res.status(400).json({
        success: false,
        message: "s3.bucket is required when S3_ASSET_BUCKET is not configured",
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

    const assetType = type || req.assetFile?.inferredType;

    if (
      req.assetFile?.inferredType &&
      type &&
      type !== req.assetFile.inferredType
    ) {
      return res.status(400).json({
        success: false,
        message: `Asset type must be ${req.assetFile.inferredType} for this file extension`,
      });
    }

    const asset = await Asset.create({
      title,
      description,
      type: assetType,
      instituteId,
      courseId: courseId || null,
      moduleId: moduleId || null,
      lessonId: lessonId || null,
      ownerId: req.user._id,
      s3: {
        ...s3,
        bucket: s3Bucket,
        region: s3.region || s3Config.region,
      },
      originalFileName,
      mimeType,
      sizeBytes,
      status,
    });

    return res.status(201).json({
      success: true,
      message: "Asset created successfully",
      data: asset,
    });
  } catch (error) {
    logger.error("asset create failed", {
      message: error.message,
      code: error.code,
      stack: error.stack,
      userId: req.user?._id || null,
      instituteId: req.body?.instituteId || null,
      courseId: req.body?.courseId || null,
      moduleId: req.body?.moduleId || null,
      lessonId: req.body?.lessonId || null,
    });

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
        message: "An asset with this S3 bucket and key already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
