"use strict";
var express = require("express");
var router = express.Router();
const {
  registerUserController,
} = require("../controllers/user/registerUserController");
const {
  getAllUsersController,
} = require("../controllers/user/getAllUsersController");
const {
  updateUserController,
} = require("../controllers/user/updateUserController");
const {
  deleteUserController,
} = require("../controllers/user/deleteUserController");
const authenticate = require("../middlewares/authentication");
const optionalAuthentication = require("../middlewares/optionalAuthentication");
const authorize = require("../middlewares/authorization");
const userController = require("../controllers/user/userController");

router.post("/register", optionalAuthentication, registerUserController);

router.delete("/delete", deleteUserController);

// must be authenticated
router.use(authenticate);
router.get("/", getAllUsersController);
router.put("/update", authorize("user"), updateUserController);
router.get("/me", authorize("user"), userController);
module.exports = router;
