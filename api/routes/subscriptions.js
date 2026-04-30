"use strict";

var express = require("express");
var router = express.Router();
const authenticate = require("../middlewares/authentication");

const {
  createSubscriptionController,
} = require("../controllers/subscription/createSubscriptionController");
const {
  getAllSubscriptionsController,
} = require("../controllers/subscription/getAllSubscriptionsController");
const {
  updateSubscriptionController,
} = require("../controllers/subscription/updateSubscriptionController");
const {
  deleteSubscriptionController,
} = require("../controllers/subscription/deleteSubscriptionController");

router.use(authenticate);

router.get("/", getAllSubscriptionsController);
router.post("/create", createSubscriptionController);
router.put("/update/:id", updateSubscriptionController);
router.delete("/delete/:id", deleteSubscriptionController);

module.exports = router;
