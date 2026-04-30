import Course from "../../models/Course.js";
import mongoose from "mongoose";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const {
  createPermission,
  deletePermission,
  PermissionServiceError,
} = require("../../services/permissionService");
const {
  AuthorizationServiceError,
  prepareCourseCreationBody,
} = require("../../services/authorizationService");

export const createCourse = async (req, res) => {
  try {
    const courseBody = await prepareCourseCreationBody(req.user?._id, req.body);
    const {
      title,
      description,
      durationWeeks,
      instituteId,
      courseAdminId,
      instructors,
      modules,
      price,
      isActive,
    } = courseBody;

    // Validate required fields
    if (!title || !instituteId || !courseAdminId) {
      return res.status(400).json({
        success: false,
        message: "Title, instituteId and courseAdminId are required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(instituteId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid instituteId format",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(courseAdminId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid courseAdminId format",
      });
    }

    // Validate instructors array contains valid ObjectIds
    if (instructors && Array.isArray(instructors)) {
      const invalidInstructors = instructors.filter(
        (id) => !mongoose.Types.ObjectId.isValid(id),
      );
      if (invalidInstructors.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Invalid instructor IDs: ${invalidInstructors.join(", ")}`,
        });
      }
    }

    // Validate modules structure if provided
    if (modules && Array.isArray(modules)) {
      for (const mod of modules) {
        if (!mod.title) {
          return res.status(400).json({
            success: false,
            message: "Each module must have a title",
          });
        }
        if (mod.lessons && Array.isArray(mod.lessons)) {
          for (const lesson of mod.lessons) {
            if (!lesson.title) {
              return res.status(400).json({
                success: false,
                message: "Each lesson must have a title",
              });
            }
          }
        }
      }
    }

    const course = await Course.create({
      title,
      description,
      durationWeeks,
      instituteId,
      instructors: instructors || [],
      modules: modules || [],
      price,
      isActive: isActive === undefined ? true : isActive,
    });

    let permissionId = null;

    try {
      const permission = await createPermission(
        {
          userId: courseAdminId,
          role: "courseAdmin",
          scopeType: "course",
          scopeId: course._id,
        },
        {
          actingUserId: req.user?._id,
        },
      );

      permissionId = permission._id;
    } catch (permissionError) {
      await Course.findByIdAndDelete(course._id);
      throw permissionError;
    }

    return res.status(201).json({
      success: true,
      message: "Course created successfully",
      data: course,
      meta: {
        courseAdminPermissionId: permissionId,
      },
    });
  } catch (error) {
    if (
      error instanceof PermissionServiceError ||
      error instanceof AuthorizationServiceError
    ) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    // Handle Mongoose validation errors
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((e) => e.message);
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
