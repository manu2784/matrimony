"use strict";

const mongoose = require("mongoose");
const Enrollment = require("../../models/Enrollment");

exports.updateEnrollmentController = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      studentId,
      courseId,
      instituteId,
      enrolledAt,
      status,
      progress,
    } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid enrollment id format",
      });
    }

    const idFields = { studentId, courseId, instituteId };
    for (const [field, value] of Object.entries(idFields)) {
      if (value !== undefined && !mongoose.Types.ObjectId.isValid(value)) {
        return res.status(400).json({
          success: false,
          message: `Invalid ${field} format`,
        });
      }
    }

    const updateData = {};
    if (studentId !== undefined) updateData.studentId = studentId;
    if (courseId !== undefined) updateData.courseId = courseId;
    if (instituteId !== undefined) updateData.instituteId = instituteId;
    if (enrolledAt !== undefined) updateData.enrolledAt = enrolledAt;
    if (status !== undefined) updateData.status = status;
    if (progress !== undefined) updateData.progress = progress;

    const enrollment = await Enrollment.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    })
      .populate("studentId", "firstName lastName email")
      .populate("courseId", "title")
      .populate("instituteId", "name");

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: "Enrollment not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Enrollment updated successfully",
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
