"use strict";
const mongoose = require("mongoose");

function getMongoUrl() {
  if (process.env.MONGODB_URI) {
    return process.env.MONGODB_URI;
  }

  return (
    "mongodb+srv://" +
    process.env.db_user +
    ":" +
    process.env.db_pass +
    "@matrimony-dev.kcxwnpe.mongodb.net/?retryWrites=true&w=majority&appName=matrimony-dev"
  );
}

const dbConnect = () => {
  return mongoose.connect(getMongoUrl(), {
    useNewUrlParser: true,
    dbName: process.env.DB_NAME || "matrimony-dev-db",
    useUnifiedTopology: true,
  });
};

module.exports = dbConnect;
