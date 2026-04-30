"use strict";

const mongoose = require("mongoose");
const Enrollment = require("../../models/Enrollment");
const { Permission } = require("../../models/Permission");
const { User } = require("../../models/User");
const {
  PermissionServiceError,
  createPermission,
} = require("../../services/permissionService");
const {
  PaymentServiceError,
  createPaymentRecord,
} = require("../../services/paymentService");

function splitStudentName(studentName) {
  const parts = String(studentName).trim().split(/\s+/).filter(Boolean);
  const firstName = parts.shift();
  const lastName = parts.join(" ") || "Student";

  return { firstName, lastName };
}

async function getCourseInstituteId(courseId) {
  const db = mongoose.connection.db;

  if (!db) {
    throw new Error("Database connection is not ready");
  }

  const course = await db
    .collection("courses")
    .findOne(
      { _id: new mongoose.Types.ObjectId(courseId) },
      { projection: { instituteId: 1 } },
    );

  return course?.instituteId || null;
}

exports.createEnrollmentController = async (req, res) => {
  const createdRecords = {
    userId: null,
    permissionId: null,
    enrollmentId: null,
    paymentId: null,
  };

  try {
    const {
      studentName,
      studentEmail,
      courseId,
      instituteId: requestedInstituteId,
      enrolledAt,
      status,
      progress,
      feePaid,
      currency,
      paymentProvider,
    } = req.body;

    if (!studentName || !studentEmail || !courseId) {
      return res.status(400).json({
        success: false,
        message: "studentName, studentEmail and courseId are required",
      });
    }

    const instituteId = requestedInstituteId || req.user?.orgId;
    const objectIdFields = {
      courseId,
      instituteId,
      enrolledBy: req.user?._id,
    };

    for (const [field, value] of Object.entries(objectIdFields)) {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        return res.status(400).json({
          success: false,
          message: `Invalid ${field} format`,
        });
      }
    }

    const courseInstituteId = await getCourseInstituteId(courseId);

    if (!courseInstituteId) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    if (String(courseInstituteId) !== String(instituteId)) {
      return res.status(400).json({
        success: false,
        message: "Course does not belong to the selected institute",
      });
    }

    const existingStudent = await User.findOne({
      email: String(studentEmail).trim().toLowerCase(),
    });

    if (existingStudent) {
      return res.status(409).json({
        success: false,
        message: "A student with this email already exists",
      });
    }

    const { firstName, lastName } = splitStudentName(studentName);
    const student = await User.create({
      firstName,
      lastName,
      email: String(studentEmail).trim().toLowerCase(),
      orgId: instituteId,
      orgType: "tenant",
      status: "enabled",
    });
    createdRecords.userId = student._id;

    const permission = await createPermission(
      {
        userId: student._id,
        role: "courseViewer",
        scopeType: "course",
        scopeId: courseId,
      },
      {
        actingUserId: req.user?._id,
      },
    );
    createdRecords.permissionId = permission._id;

    const normalizedFeePaid =
      feePaid === undefined || feePaid === "" ? 0 : Number(feePaid);

    if (!Number.isFinite(normalizedFeePaid) || normalizedFeePaid < 0) {
      return res.status(400).json({
        success: false,
        message: "feePaid must be a positive number",
      });
    }

    const enrollment = await Enrollment.create({
      studentId: student._id,
      courseId,
      instituteId,
      enrolledBy: req.user._id,
      enrolledAt,
      status,
      progress,
      feePaid: normalizedFeePaid,
    });
    createdRecords.enrollmentId = enrollment._id;

    const payment = await createPaymentRecord({
      userId: student._id,
      courseId,
      instituteId,
      amount: normalizedFeePaid,
      currency,
      paymentType: "enrollment",
      paymentProvider,
      status: normalizedFeePaid > 0 ? "success" : "pending",
    });
    createdRecords.paymentId = payment._id;

    return res.status(201).json({
      success: true,
      message: "Enrollment created successfully",
      data: {
        enrollment,
        student,
        payment,
      },
    });
  } catch (error) {
    if (createdRecords.paymentId) {
      await mongoose.connection.db
        .collection("payments")
        .deleteOne({ _id: createdRecords.paymentId })
        .catch(() => {});
    }

    if (createdRecords.enrollmentId) {
      await Enrollment.findByIdAndDelete(createdRecords.enrollmentId).catch(
        () => {},
      );
    }

    if (createdRecords.permissionId) {
      await Permission.findByIdAndDelete(createdRecords.permissionId).catch(
        () => {},
      );
    }

    if (createdRecords.userId) {
      await User.findByIdAndDelete(createdRecords.userId).catch(() => {});
    }

    if (
      error instanceof PermissionServiceError ||
      error instanceof PaymentServiceError
    ) {
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
