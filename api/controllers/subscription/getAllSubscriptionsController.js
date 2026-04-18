"use strict";

const mongoose = require("mongoose");
const Subscription = require("../../models/Subscription");

exports.getAllSubscriptionsController = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      userId,
      plan,
      status,
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

    if (plan) filter.plan = plan;
    if (status) filter.status = status;

    const sortOrder = order === "asc" ? 1 : -1;
    const skip = (Number(page) - 1) * Number(limit);

    const [subscriptions, total] = await Promise.all([
      Subscription.find(filter)
        .populate("userId", "firstName lastName email")
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(Number(limit)),
      Subscription.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: subscriptions,
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
