"use strict";
var express = require("express");
var router = express.Router();

var courseController = require("../controllers/course/courseController");
var getCourseController = require("../controllers/course/getCourseController");

router.post("/create", courseController.createCourse);
router.get("/", getCourseController.getCourses);
// router.get("/:id", courseController.getCourseById);
// router.put("/update/:id", courseController.updateCourse);
// router.delete("/delete/:id", courseController.deleteCourse);

module.exports = router;
