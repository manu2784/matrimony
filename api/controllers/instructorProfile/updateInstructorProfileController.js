"use strict";

const mongoose = require("mongoose");
const InstructorProfile = require("../../models/InstructorProfile");

exports.updateInstructorProfileController = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, bio, expertise, experienceYears, rating, totalStudents } =
      req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid instructor profile id format",
      });
    }

    if (userId !== undefined && !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid userId format",
      });
    }

    const updateData = {};
    if (userId !== undefined) updateData.userId = userId;
    if (bio !== undefined) updateData.bio = bio;
    if (expertise !== undefined) updateData.expertise = expertise;
    if (experienceYears !== undefined) {
      updateData.experienceYears = experienceYears;
    }
    if (rating !== undefined) updateData.rating = rating;
    if (totalStudents !== undefined) updateData.totalStudents = totalStudents;

    const instructorProfile = await InstructorProfile.findByIdAndUpdate(
      id,
      updateData,
      {
        new: true,
        runValidators: true,
      },
    ).populate("userId", "firstName lastName email");

    if (!instructorProfile) {
      return res.status(404).json({
        success: false,
        message: "Instructor profile not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Instructor profile updated successfully",
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
