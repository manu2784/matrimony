"use strict";

const mongoose = require("mongoose");
const Payment = require("../../models/Payment");

exports.getAllPaymentsController = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      userId,
      courseId,
      status,
      paymentProvider,
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

    if (courseId) {
      if (!mongoose.Types.ObjectId.isValid(courseId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid courseId format",
        });
      }
      filter.courseId = courseId;
    }

    if (status) filter.status = status;
    if (paymentProvider) filter.paymentProvider = paymentProvider;

    const sortOrder = order === "asc" ? 1 : -1;
    const skip = (Number(page) - 1) * Number(limit);

    const [payments, total] = await Promise.all([
      Payment.find(filter)
        .populate("userId", "firstName lastName email")
        .populate("courseId", "title")
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(Number(limit)),
      Payment.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: payments,
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
