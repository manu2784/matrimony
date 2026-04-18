"use strict";

const mongoose = require("mongoose");
const Institute = require("../../models/Institute");

exports.createInstituteController = async (req, res) => {
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

    const institute = await Institute.create({
      name,
      description,
      admin,
      isActive: isActive ?? true,
    });

    return res.status(201).json({
      success: true,
      message: "Institute created successfully",
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
