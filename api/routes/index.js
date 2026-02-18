var express = require("express");
var router = express.Router();
const loginController = require("../controllers/loginController");
const welcomeController = require("../controllers/welcomeController");
const logoutController = require("../controllers/logoutController");

/* GET home page. */
router.get("/", function (req, res, next) {
  res.send({ status: "ok" });
});
router.get("/welcome", welcomeController);
router.post("/login", loginController);
router.post("/logout", logoutController);

module.exports = router;
