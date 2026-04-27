"use strict";

var express = require("express");
var router = express.Router();

const authenticate = require("../middlewares/authentication");
const {
  authorizeInstituteManagement,
} = require("../services/authorizationService");
const {
  createInstituteController,
} = require("../controllers/institute/createInstituteController");
const {
  getAllInstitutesController,
} = require("../controllers/institute/getAllInstitutesController");
const {
  updateInstituteController,
} = require("../controllers/institute/updateInstituteController");
const {
  deleteInstituteController,
} = require("../controllers/institute/deleteInstituteController");

router.use(authenticate);
router.use(authorizeInstituteManagement());

router.get("/", getAllInstitutesController);
router.post("/create", createInstituteController);
router.put("/update/:id", updateInstituteController);
router.delete("/delete/:id", deleteInstituteController);

module.exports = router;
