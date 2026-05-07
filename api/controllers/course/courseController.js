import Course from "../../models/Course.js";
import mongoose from "mongoose";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const {
  createPermission,
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

function validateCourseId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

function buildCourseUpdateData(body) {
  const updateData = {};

  if (body.title !== undefined) updateData.title = body.title;
  if (body.description !== undefined) updateData.description = body.description;
  if (body.durationWeeks !== undefined)
    updateData.durationWeeks = body.durationWeeks;
  if (body.instructors !== undefined) updateData.instructors = body.instructors;
  if (body.modules !== undefined) updateData.modules = body.modules;
  if (body.price !== undefined) updateData.price = body.price;
  if (body.isActive !== undefined) updateData.isActive = body.isActive;

  return updateData;
}

function validateCoursePayload({ title, instructors, modules }) {
  if (title !== undefined && !String(title).trim()) {
    return "Course title cannot be empty";
  }

  if (instructors && Array.isArray(instructors)) {
    const invalidInstructors = instructors.filter(
      (id) => !mongoose.Types.ObjectId.isValid(id),
    );
    if (invalidInstructors.length > 0) {
      return `Invalid instructor IDs: ${invalidInstructors.join(", ")}`;
    }
  }

  if (modules && Array.isArray(modules)) {
    for (const mod of modules) {
      if (!mod.title) {
        return "Each module must have a title";
      }
      if (mod.lessons && Array.isArray(mod.lessons)) {
        for (const lesson of mod.lessons) {
          if (!lesson.title) {
            return "Each lesson must have a title";
          }
        }
      }
    }
  }

  return null;
}

export const getCourseById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!validateCourseId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid course id format",
      });
    }

    const course = await Course.findById(id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: course,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export const updateCourse = async (req, res) => {
  try {
    const { id } = req.params;

    if (!validateCourseId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid course id format",
      });
    }

    const validationMessage = validateCoursePayload(req.body);

    if (validationMessage) {
      return res.status(400).json({
        success: false,
        message: validationMessage,
      });
    }

    const course = await Course.findByIdAndUpdate(
      id,
      buildCourseUpdateData(req.body),
      {
        new: true,
        runValidators: true,
      },
    );

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Course updated successfully",
      data: course,
    });
  } catch (error) {
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

export const deleteCourse = async (req, res) => {
  try {
    const { id } = req.params;

    if (!validateCourseId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid course id format",
      });
    }

    const course = await Course.findByIdAndDelete(id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Course deleted successfully",
      data: course,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};
