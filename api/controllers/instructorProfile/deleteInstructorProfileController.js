"use strict";

const mongoose = require("mongoose");
const InstructorProfile = require("../../models/InstructorProfile");

exports.deleteInstructorProfileController = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid instructor profile id format",
      });
    }

    const instructorProfile = await InstructorProfile.findByIdAndDelete(id);

    if (!instructorProfile) {
      return res.status(404).json({
        success: false,
        message: "Instructor profile not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Instructor profile deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};
