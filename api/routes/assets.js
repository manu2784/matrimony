"use strict";

var express = require("express");
var router = express.Router();

const authenticate = require("../middlewares/authentication");
const assetRouteLogger = require("../middlewares/assetRouteLogger");
const assetUpload = require("../middlewares/assetUpload");
const validateAssetFile = require("../middlewares/assetFileValidation");
const createRateLimiter = require("../middlewares/rateLimiter");
const {
  createAssetController,
} = require("../controllers/asset/createAssetController");
const {
  getAssetByIdController,
  getAssetsController,
} = require("../controllers/asset/getAssetsController");
const {
  updateAssetController,
} = require("../controllers/asset/updateAssetController");
const {
  deleteAssetController,
} = require("../controllers/asset/deleteAssetController");
const {
  createAssetDownloadUrlController,
  createAssetUploadUrlController,
} = require("../controllers/asset/presignedAssetController");
const {
  uploadAssetController,
} = require("../controllers/asset/uploadAssetController");

const assetRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 60,
});

router.use(authenticate);
router.use(assetRouteLogger);
router.use(assetRateLimiter);

router.get("/", getAssetsController);
router.post("/upload", assetUpload, validateAssetFile, uploadAssetController);
router.post("/create", validateAssetFile, createAssetController);
router.post(
  "/presigned-upload",
  validateAssetFile,
  createAssetUploadUrlController,
);
router.post("/:id/presigned-download", createAssetDownloadUrlController);
router.get("/:id", getAssetByIdController);
router.put("/update/:id", updateAssetController);
router.put("/update-file/:id", validateAssetFile, updateAssetController);
router.delete("/delete/:id", deleteAssetController);

module.exports = router;
