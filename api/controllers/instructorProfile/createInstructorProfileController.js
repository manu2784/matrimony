"use strict";

const mongoose = require("mongoose");
const InstructorProfile = require("../../models/InstructorProfile");

exports.createInstructorProfileController = async (req, res) => {
  try {
    const {
      userId,
      bio,
      expertise,
      experienceYears,
      rating,
      totalStudents,
    } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "userId is required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid userId format",
      });
    }

    const instructorProfile = await InstructorProfile.create({
      userId,
      bio,
      expertise,
      experienceYears,
      rating,
      totalStudents,
    });

    return res.status(201).json({
      success: true,
      message: "Instructor profile created successfully",
      data: instructorProfile,
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
