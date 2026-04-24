"use strict";

const express = require("express");
const authenticate = require("../middlewares/authentication");
const {
  listPermissionsController,
  getPermissionController,
  createPermissionController,
  updatePermissionController,
  deletePermissionController,
} = require("../controllers/permission/permissionController");

const router = express.Router();

// router.use(authenticate);

router.get("/", listPermissionsController);
router.get("/:id", getPermissionController);
router.post("/create", createPermissionController);
router.put("/update/:id", updatePermissionController);
router.delete("/delete/:id", deletePermissionController);

module.exports = router;
