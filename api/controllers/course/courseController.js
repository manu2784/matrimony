import Course from "../../models/Course.js";
import mongoose from "mongoose";

export const createCourse = async (req, res) => {
  try {
    const {
      title,
      description,
      durationHours,
      instituteId,
      instructors,
      modules,
      price,
      isActive,
    } = req.body;

    // Validate required fields
    if (!title || !instituteId) {
      return res.status(400).json({
        success: false,
        message: "Title and instituteId are required",
      });
    }

    // Validate instituteId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(instituteId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid instituteId format",
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
      durationHours,
      instituteId,
      instructors: instructors || [],
      modules: modules || [],
      price,
      isActive: isActive ?? true,
    });

    return res.status(201).json({
      success: true,
      message: "Course created successfully",
      data: course,
    });
  } catch (error) {
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
