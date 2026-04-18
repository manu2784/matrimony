"use strict";

var express = require("express");
var router = express.Router();

const {
  createInstructorProfileController,
} = require("../controllers/instructorProfile/createInstructorProfileController");
const {
  getAllInstructorProfilesController,
} = require("../controllers/instructorProfile/getAllInstructorProfilesController");
const {
  updateInstructorProfileController,
} = require("../controllers/instructorProfile/updateInstructorProfileController");
const {
  deleteInstructorProfileController,
} = require("../controllers/instructorProfile/deleteInstructorProfileController");

router.get("/", getAllInstructorProfilesController);
router.post("/create", createInstructorProfileController);
router.put("/update/:id", updateInstructorProfileController);
router.delete("/delete/:id", deleteInstructorProfileController);

module.exports = router;
