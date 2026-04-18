"use strict";

const mongoose = require("mongoose");
const Institute = require("../../models/Institute");

exports.updateInstituteController = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, admin, isActive } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid institute id format",
      });
    }

    if (admin && !mongoose.Types.ObjectId.isValid(admin)) {
      return res.status(400).json({
        success: false,
        message: "Invalid admin format",
      });
    }

    const updateData = {};

    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (admin !== undefined) updateData.admin = admin;
    if (isActive !== undefined) updateData.isActive = isActive;

    const institute = await Institute.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).populate("admin", "firstName lastName email");

    if (!institute) {
      return res.status(404).json({
        success: false,
        message: "Institute not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Institute updated successfully",
      data: institute,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors,
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};
