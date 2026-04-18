"use strict";

const Institute = require("../../models/Institute");
const mongoose = require("mongoose");

exports.getAllInstitutesController = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      isActive,
      admin,
      search,
      sortBy = "createdAt",
      order = "desc",
    } = req.query;

    const filter = {};

    if (isActive !== undefined) {
      filter.isActive = isActive === "true";
    }

    if (admin) {
      if (!mongoose.Types.ObjectId.isValid(admin)) {
        return res.status(400).json({
          success: false,
          message: "Invalid admin format",
        });
      }
      filter.admin = admin;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const sortOrder = order === "asc" ? 1 : -1;
    const skip = (Number(page) - 1) * Number(limit);

    const [institutes, total] = await Promise.all([
      Institute.find(filter)
        .populate("admin", "firstName lastName email")
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(Number(limit)),
      Institute.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: institutes,
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
