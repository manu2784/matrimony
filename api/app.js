var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var cors = require("cors");

var indexRouter = require("./routes/index");
var usersRouter = require("./routes/users");
var coursesRouter = require("./routes/courses");
var institutesRouter = require("./routes/institutes");
var permissionsRouter = require("./routes/permissions");
var enrollmentsRouter = require("./routes/enrollments");
var instructorProfilesRouter = require("./routes/instructorProfiles");
var paymentsRouter = require("./routes/payments");
var subscriptionsRouter = require("./routes/subscriptions");
const { hostname } = require("os");

var app = express();

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  }),
);
app.use(cookieParser());
app.use("/", indexRouter);
app.use("/users", usersRouter);
app.use("/courses", coursesRouter);
app.use("/institutes", institutesRouter);
app.use("/permissions", permissionsRouter);
app.use("/enrollments", enrollmentsRouter);
app.use("/instructor-profiles", instructorProfilesRouter);
app.use("/payments", paymentsRouter);
app.use("/subscriptions", subscriptionsRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
