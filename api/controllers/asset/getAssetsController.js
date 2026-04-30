"use strict";

const mongoose = require("mongoose");
const Asset = require("../../models/Asset");
const logger = require("../../modules/logger");

exports.getAssetsController = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      type,
      status,
      instituteId,
      courseId,
      ownerId,
      search,
      sortBy = "createdAt",
      order = "desc",
    } = req.query;

    const filter = {};

    const objectIdFilters = { instituteId, courseId, ownerId };
    for (const [field, value] of Object.entries(objectIdFilters)) {
      if (!value) continue;
      if (!mongoose.Types.ObjectId.isValid(value)) {
        return res.status(400).json({
          success: false,
          message: `Invalid ${field} format`,
        });
      }
      filter[field] = value;
    }

    if (type) filter.type = type;
    if (status) filter.status = status;

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { originalFileName: { $regex: search, $options: "i" } },
      ];
    }

    const sortOrder = order === "asc" ? 1 : -1;
    const skip = (Number(page) - 1) * Number(limit);

    const [assets, total] = await Promise.all([
      Asset.find(filter)
        .populate("instituteId", "name")
        .populate("courseId", "title")
        .populate("ownerId", "firstName lastName email")
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(Number(limit)),
      Asset.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: assets,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    logger.error("asset list failed", {
      message: error.message,
      stack: error.stack,
      query: req.query,
      userId: req.user?._id || null,
    });

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

exports.getAssetByIdController = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid asset id format",
      });
    }

    const asset = await Asset.findById(id)
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
      data: asset,
    });
  } catch (error) {
    logger.error("asset get by id failed", {
      message: error.message,
      stack: error.stack,
      assetId: req.params?.id || null,
      userId: req.user?._id || null,
    });

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
