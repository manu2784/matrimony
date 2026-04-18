"use strict";

const mongoose = require("mongoose");
const Payment = require("../../models/Payment");

exports.createPaymentController = async (req, res) => {
  try {
    const { userId, courseId, amount, currency, paymentProvider, status } =
      req.body;

    if (!userId || amount === undefined) {
      return res.status(400).json({
        success: false,
        message: "userId and amount are required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid userId format",
      });
    }

    if (courseId !== undefined && !mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid courseId format",
      });
    }

    const payment = await Payment.create({
      userId,
      courseId,
      amount,
      currency,
      paymentProvider,
      status,
    });

    return res.status(201).json({
      success: true,
      message: "Payment created successfully",
      data: payment,
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
