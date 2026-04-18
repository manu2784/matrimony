"use strict";

const mongoose = require("mongoose");
const InstructorProfile = require("../../models/InstructorProfile");

exports.getAllInstructorProfilesController = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      userId,
      search,
      sortBy = "createdAt",
      order = "desc",
    } = req.query;

    const filter = {};

    if (userId) {
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid userId format",
        });
      }
      filter.userId = userId;
    }

    if (search) {
      filter.$or = [
        { bio: { $regex: search, $options: "i" } },
        { expertise: { $regex: search, $options: "i" } },
      ];
    }

    const sortOrder = order === "asc" ? 1 : -1;
    const skip = (Number(page) - 1) * Number(limit);

    const [instructorProfiles, total] = await Promise.all([
      InstructorProfile.find(filter)
        .populate("userId", "firstName lastName email")
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(Number(limit)),
      InstructorProfile.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: instructorProfiles,
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
