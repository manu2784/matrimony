"use strict";
var express = require("express");
var router = express.Router();
const {
  registerUserController,
} = require("../controllers/user/registerUserController");
const {
  updateUserController,
} = require("../controllers/user/updateUserController");
const {
  deleteUserController,
} = require("../controllers/user/deleteUserController");
const authenticate = require("../middlewares/authentication");
const authorize = require("../middlewares/authorization");

/* GET users listing. */
router.get("/", function (req, res, next) {
  res.send("respond with a resource");
});
router.post("/register", registerUserController);

router.delete("/delete", deleteUserController);

// must be authenticated
router.use(authenticate);

router.put("/update", authorize("user"), updateUserController);

module.exports = router;
