import Course from "../../models/Course.js";
import mongoose from "mongoose";

// GET /api/courses
export const getCourses = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      isActive,
      instituteId,
      search,
      sortBy = "createdAt",
      order = "desc",
    } = req.query;

    const filter = {};

    if (isActive !== undefined) filter.isActive = isActive === "true";
    if (instituteId) {
      if (!mongoose.Types.ObjectId.isValid(instituteId)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid instituteId" });
      }
      filter.instituteId = instituteId;
    }
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const sortOrder = order === "asc" ? 1 : -1;
    const skip = (Number(page) - 1) * Number(limit);

    const [courses, total] = await Promise.all([
      Course.find(filter), // exclude heavy nested data from list view
      /*.populate("instituteId", "name")
        .populate("instructors", "name email")
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(Number(limit))
        .select("-modules")*/ Course.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: courses,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};
