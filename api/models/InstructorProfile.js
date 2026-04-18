"use strict";
const mongoose = require("mongoose");

const instructorProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    bio: String,

    expertise: [String],

    experienceYears: Number,

    rating: {
      type: Number,
      default: 0,
    },

    totalStudents: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
);

const InstructorProfile = mongoose.model(
  "InstructorProfile",
  instructorProfileSchema,
);

module.exports = InstructorProfile;
