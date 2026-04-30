"use strict";

const mongoose = require("mongoose");
const Asset = require("../../models/Asset");
const logger = require("../../modules/logger");
const { deleteAssetObject } = require("../../services/s3AssetService");

exports.deleteAssetController = async (req, res) => {
  try {
    const { id } = req.params;
    const deleteFromS3 = req.query.deleteFromS3 === "true";

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid asset id format",
      });
    }

    const asset = await Asset.findByIdAndDelete(id);

    if (!asset) {
      return res.status(404).json({
        success: false,
        message: "Asset not found",
      });
    }

    if (deleteFromS3) {
      await deleteAssetObject({ key: asset.s3.key });
    }

    return res.status(200).json({
      success: true,
      message: "Asset deleted successfully",
    });
  } catch (error) {
    logger.error("asset delete failed", {
      message: error.message,
      code: error.code,
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
