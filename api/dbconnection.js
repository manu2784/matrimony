"use strict";
const mongoose = require("mongoose");

const url =
  "mongodb+srv://" +
  process.env.db_user +
  ":" +
  process.env.db_pass +
  "@matrimony-dev.kcxwnpe.mongodb.net/?retryWrites=true&w=majority&appName=matrimony-dev";

const dbConnect = () => {
  return mongoose.connect(url, {
    useNewUrlParser: true,
    dbName: "matrimony-dev-db",
    useUnifiedTopology: true,
  });
};

module.exports = dbConnect;
