"use strict";

const mongoose = require("mongoose");
const Enrollment = require("../../models/Enrollment");

exports.createEnrollmentController = async (req, res) => {
  try {
    const {
      studentId,
      courseId,
      instituteId,
      enrolledAt,
      status,
      progress,
    } = req.body;

    if (!studentId || !courseId || !instituteId) {
      return res.status(400).json({
        success: false,
        message: "studentId, courseId and instituteId are required",
      });
    }

    const objectIdFields = { studentId, courseId, instituteId };
    for (const [field, value] of Object.entries(objectIdFields)) {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        return res.status(400).json({
          success: false,
          message: `Invalid ${field} format`,
        });
      }
    }

    const enrollment = await Enrollment.create({
      studentId,
      courseId,
      instituteId,
      enrolledAt,
      status,
      progress,
    });

    return res.status(201).json({
      success: true,
      message: "Enrollment created successfully",
      data: enrollment,
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
