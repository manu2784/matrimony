"use strict";

const mongoose = require("mongoose");

const ASSET_TYPES = ["video", "image", "pdf", "slide"];

const assetSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      trim: true,
    },

    type: {
      type: String,
      enum: ASSET_TYPES,
      required: true,
    },

    instituteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Institute",
      required: true,
      index: true,
    },

    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      default: null,
      index: true,
    },

    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    s3: {
      bucket: {
        type: String,
        required: true,
        trim: true,
      },
      key: {
        type: String,
        required: true,
        trim: true,
      },
      region: {
        type: String,
        trim: true,
      },
      versionId: {
        type: String,
        trim: true,
      },
    },

    originalFileName: {
      type: String,
      trim: true,
    },

    mimeType: {
      type: String,
      trim: true,
    },

    sizeBytes: {
      type: Number,
      min: 0,
    },

    status: {
      type: String,
      enum: ["active", "archived"],
      default: "active",
    },
  },
  { timestamps: true },
);

assetSchema.index({ instituteId: 1, courseId: 1, type: 1 });
assetSchema.index({ "s3.bucket": 1, "s3.key": 1 }, { unique: true });

const Asset = mongoose.model("Asset", assetSchema);

module.exports = Asset;
module.exports.ASSET_TYPES = ASSET_TYPES;
