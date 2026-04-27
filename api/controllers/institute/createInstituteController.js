"use strict";

const mongoose = require("mongoose");
const Institute = require("../../models/Institute");
const { User } = require("../../models/User");
const { Permission } = require("../../models/Permission");

exports.createInstituteController = async (req, res) => {
  let institute = null;

  try {
    const { name, description, admin, isActive } = req.body;

    if (!name || !admin) {
      return res.status(400).json({
        success: false,
        message: "Name and admin are required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(admin)) {
      return res.status(400).json({
        success: false,
        message: "Invalid admin format",
      });
    }

    const accountManager = await User.findById(admin).select(
      "_id orgType firstName lastName email",
    );

    if (!accountManager) {
      return res.status(404).json({
        success: false,
        message: "Selected account manager was not found",
      });
    }

    if (accountManager.orgType !== "provider") {
      return res.status(400).json({
        success: false,
        message: "Selected account manager must have org type provider",
      });
    }

    institute = await Institute.create({
      name,
      description,
      admin,
      isActive: isActive ?? true,
    });

    await Permission.create({
      userId: accountManager._id,
      role: "accountManager",
      scopeType: "org",
      scopeId: institute._id,
      grantedBy: req.user?._id || null,
    });

    return res.status(201).json({
      success: true,
      message: "Institute created successfully",
      data: institute,
    });
  } catch (error) {
    if (institute?._id) {
      try {
        await Institute.findByIdAndDelete(institute._id);
      } catch {
        // Best effort rollback if permission creation fails after org creation.
      }
    }

    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors,
      });
    }

    if (error && error.code === 11000) {
      return res.status(409).json({
        success: false,
        message:
          "An account manager permission for this organization already exists.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};
