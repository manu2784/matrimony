"use strict";

var express = require("express");
var router = express.Router();

const {
  createPaymentController,
} = require("../controllers/payment/createPaymentController");
const {
  getAllPaymentsController,
} = require("../controllers/payment/getAllPaymentsController");
const {
  updatePaymentController,
} = require("../controllers/payment/updatePaymentController");
const {
  deletePaymentController,
} = require("../controllers/payment/deletePaymentController");

router.get("/", getAllPaymentsController);
router.post("/create", createPaymentController);
router.put("/update/:id", updatePaymentController);
router.delete("/delete/:id", deletePaymentController);

module.exports = router;
