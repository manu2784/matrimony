"use strict";

const mongoose = require("mongoose");
const Enrollment = require("../../models/Enrollment");

exports.getAllEnrollmentsController = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      studentId,
      courseId,
      instituteId,
      status,
      sortBy = "createdAt",
      order = "desc",
    } = req.query;

    const filter = {};
    const idFilters = { studentId, courseId, instituteId };

    for (const [field, value] of Object.entries(idFilters)) {
      if (value) {
        if (!mongoose.Types.ObjectId.isValid(value)) {
          return res.status(400).json({
            success: false,
            message: `Invalid ${field} format`,
          });
        }
        filter[field] = value;
      }
    }

    if (status) filter.status = status;

    const sortOrder = order === "asc" ? 1 : -1;
    const skip = (Number(page) - 1) * Number(limit);

    const [enrollments, total] = await Promise.all([
      Enrollment.find(filter)
        .populate("studentId", "firstName lastName email")
        .populate("courseId", "title")
        .populate("instituteId", "name")
        .populate("enrolledBy", "firstName lastName email")
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(Number(limit)),
      Enrollment.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: enrollments,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};
