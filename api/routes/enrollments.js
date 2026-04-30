"use strict";

var express = require("express");
var router = express.Router();
const authenticate = require("../middlewares/authentication");
const { Permission } = require("../models/Permission");

const {
  createEnrollmentController,
} = require("../controllers/enrollment/createEnrollmentController");
const {
  getAllEnrollmentsController,
} = require("../controllers/enrollment/getAllEnrollmentsController");
const {
  updateEnrollmentController,
} = require("../controllers/enrollment/updateEnrollmentController");
const {
  deleteEnrollmentController,
} = require("../controllers/enrollment/deleteEnrollmentController");

router.use(authenticate);

async function authorizeEnrollmentCreator(req, res, next) {
  try {
    const permissions = await Permission.getForUser(req.user?._id);
    const canCreateEnrollment = permissions.some((permission) =>
      ["orgSuperAdmin", "courseAdmin"].includes(permission.role),
    );

    if (!canCreateEnrollment) {
      return res.status(403).json({
        success: false,
        message:
          "Only org super admins and course admins can create enrollments",
      });
    }

    return next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
}

router.get("/", getAllEnrollmentsController);
router.post("/create", authorizeEnrollmentCreator, createEnrollmentController);
router.put("/update/:id", updateEnrollmentController);
router.delete("/delete/:id", deleteEnrollmentController);

module.exports = router;
