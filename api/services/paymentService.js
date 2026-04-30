"use strict";

const mongoose = require("mongoose");
const Payment = require("../models/Payment");

class PaymentServiceError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.name = "PaymentServiceError";
    this.statusCode = statusCode;
  }
}

function validateObjectId(value, fieldName, required = false) {
  if (!value) {
    if (required) {
      throw new PaymentServiceError(`${fieldName} is required`, 400);
    }
    return undefined;
  }

  if (!mongoose.Types.ObjectId.isValid(value)) {
    throw new PaymentServiceError(`Invalid ${fieldName} format`, 400);
  }

  return value;
}

async function createPaymentRecord(payload, options = {}) {
  const {
    userId,
    courseId,
    instituteId,
    amount,
    currency,
    paymentType,
    paymentProvider,
    status,
  } = payload;

  validateObjectId(userId, "userId", true);
  validateObjectId(courseId, "courseId");
  validateObjectId(instituteId, "instituteId");

  if (amount === undefined || amount === null || amount === "") {
    throw new PaymentServiceError("amount is required", 400);
  }

  const normalizedAmount = Number(amount);

  if (!Number.isFinite(normalizedAmount) || normalizedAmount < 0) {
    throw new PaymentServiceError("amount must be a positive number", 400);
  }

  if (!paymentType) {
    throw new PaymentServiceError("paymentType is required", 400);
  }

  const payment = await Payment.create(
    [
      {
        userId,
        courseId,
        instituteId,
        amount: normalizedAmount,
        currency,
        paymentType,
        paymentProvider,
        status,
      },
    ],
    options.session ? { session: options.session } : undefined,
  );

  return Array.isArray(payment) ? payment[0] : payment;
}

module.exports = {
  PaymentServiceError,
  createPaymentRecord,
};
