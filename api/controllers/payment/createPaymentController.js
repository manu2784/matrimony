"use strict";

const {
  PaymentServiceError,
  createPaymentRecord,
} = require("../../services/paymentService");

exports.createPaymentController = async (req, res) => {
  try {
    const payment = await createPaymentRecord(req.body);

    return res.status(201).json({
      success: true,
      message: "Payment created successfully",
      data: payment,
    });
  } catch (error) {
    if (error instanceof PaymentServiceError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

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
