"use strict";
const mongoose = require("mongoose");

const enrollmentSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },

    instituteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Institute",
      required: true,
    },

    enrolledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    feePaid: {
      type: Number,
      min: 0,
      default: 0,
    },

    enrolledAt: {
      type: Date,
      default: Date.now,
    },

    status: {
      type: String,
      enum: ["active", "completed", "cancelled"],
      default: "active",
    },

    progress: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
);

const Enrollment = mongoose.model("Enrollment", enrollmentSchema);

module.exports = Enrollment;
