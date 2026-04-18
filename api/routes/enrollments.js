"use strict";

var express = require("express");
var router = express.Router();

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

router.get("/", getAllEnrollmentsController);
router.post("/create", createEnrollmentController);
router.put("/update/:id", updateEnrollmentController);
router.delete("/delete/:id", deleteEnrollmentController);

module.exports = router;
