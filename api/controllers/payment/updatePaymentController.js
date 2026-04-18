"use strict";

const mongoose = require("mongoose");
const Payment = require("../../models/Payment");

exports.updatePaymentController = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, courseId, amount, currency, paymentProvider, status } =
      req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment id format",
      });
    }

    if (userId !== undefined && !mongoose.Types.ObjectId.isValid(userId)) {
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

    const updateData = {};
    if (userId !== undefined) updateData.userId = userId;
    if (courseId !== undefined) updateData.courseId = courseId;
    if (amount !== undefined) updateData.amount = amount;
    if (currency !== undefined) updateData.currency = currency;
    if (paymentProvider !== undefined) {
      updateData.paymentProvider = paymentProvider;
    }
    if (status !== undefined) updateData.status = status;

    const payment = await Payment.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    })
      .populate("userId", "firstName lastName email")
      .populate("courseId", "title");

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Payment updated successfully",
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
