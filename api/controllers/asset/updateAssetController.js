"use strict";

const mongoose = require("mongoose");
const Asset = require("../../models/Asset");
const logger = require("../../modules/logger");

exports.updateAssetController = async (req, res) => {
  try {
    const { id } = req.params;
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

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid asset id format",
      });
    }

    const objectIdFields = { instituteId, courseId, moduleId, lessonId };
    for (const [field, value] of Object.entries(objectIdFields)) {
      if (value && !mongoose.Types.ObjectId.isValid(value)) {
        return res.status(400).json({
          success: false,
          message: `Invalid ${field} format`,
        });
      }
    }

    if ((moduleId || lessonId) && courseId !== undefined && !courseId) {
      return res.status(400).json({
        success: false,
        message: "courseId is required when moduleId or lessonId is provided",
      });
    }

    if (lessonId && moduleId !== undefined && !moduleId) {
      return res.status(400).json({
        success: false,
        message: "moduleId is required when lessonId is provided",
      });
    }

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

    const updateData = {};

    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (type !== undefined) updateData.type = type;
    if (instituteId !== undefined) updateData.instituteId = instituteId;
    if (courseId !== undefined) updateData.courseId = courseId || null;
    if (moduleId !== undefined) updateData.moduleId = moduleId || null;
    if (lessonId !== undefined) updateData.lessonId = lessonId || null;
    if (s3 !== undefined) updateData.s3 = s3;
    if (originalFileName !== undefined)
      updateData.originalFileName = originalFileName;
    if (mimeType !== undefined) updateData.mimeType = mimeType;
    if (sizeBytes !== undefined) updateData.sizeBytes = sizeBytes;
    if (status !== undefined) updateData.status = status;

    const asset = await Asset.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    })
      .populate("instituteId", "name")
      .populate("courseId", "title")
      .populate("ownerId", "firstName lastName email");

    if (!asset) {
      return res.status(404).json({
        success: false,
        message: "Asset not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Asset updated successfully",
      data: asset,
    });
  } catch (error) {
    logger.error("asset update failed", {
      message: error.message,
      code: error.code,
      stack: error.stack,
      assetId: req.params?.id || null,
      userId: req.user?._id || null,
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
