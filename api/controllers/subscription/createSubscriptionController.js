"use strict";

const mongoose = require("mongoose");
const Subscription = require("../../models/Subscription");

exports.createSubscriptionController = async (req, res) => {
  try {
    const { userId, plan, startDate, endDate, status } = req.body;

    if (!userId || !plan) {
      return res.status(400).json({
        success: false,
        message: "userId and plan are required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid userId format",
      });
    }

    const subscription = await Subscription.create({
      userId,
      plan,
      startDate,
      endDate,
      status,
    });

    return res.status(201).json({
      success: true,
      message: "Subscription created successfully",
      data: subscription,
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
