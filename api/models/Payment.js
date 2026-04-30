"use strict";
const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
    },
    instituteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Institute",
    },

    amount: {
      type: Number,
      required: true,
    },

    currency: {
      type: String,
      default: "USD",
    },

    paymentType: {
      type: String,
      enum: ["enrollment", "subscription", "onboarding"],
      required: true,
    },

    paymentProvider: {
      type: String,
      enum: ["stripe", "razorpay", "paypal"],
    },

    status: {
      type: String,
      enum: ["pending", "success", "failed"],
      default: "pending",
    },
  },
  { timestamps: true },
);

const Payment = mongoose.model("Payment", paymentSchema);

module.exports = Payment;
