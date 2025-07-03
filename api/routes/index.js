var express = require("express");
var router = express.Router();
const loginController = require("../controllers/loginController");

/* GET home page. */
router.get("/", function (req, res, next) {
  res.send({ status: "ok" });
});
router.post("/login", loginController);

module.exports = router;
