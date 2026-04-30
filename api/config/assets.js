"use strict";

const MB = 1024 * 1024;

const ALLOWED_FILE_EXTENSIONS = Object.freeze([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".gif",
  ".mp4",
  ".webm",
  ".mov",
  ".pdf",
  ".ppt",
  ".pptx",
]);

const MAX_FILE_SIZE_BY_EXTENSION = Object.freeze({
  ".jpg": 5 * MB,
  ".jpeg": 5 * MB,
  ".png": 5 * MB,
  ".webp": 5 * MB,
  ".gif": 5 * MB,
  ".mp4": 200 * MB,
  ".webm": 200 * MB,
  ".mov": 200 * MB,
  ".pdf": 20 * MB,
  ".ppt": 30 * MB,
  ".pptx": 30 * MB,
});

const ASSET_TYPE_BY_EXTENSION = Object.freeze({
  ".jpg": "image",
  ".jpeg": "image",
  ".png": "image",
  ".webp": "image",
  ".gif": "image",
  ".mp4": "video",
  ".webm": "video",
  ".mov": "video",
  ".pdf": "pdf",
  ".ppt": "slide",
  ".pptx": "slide",
});

module.exports = {
  ALLOWED_FILE_EXTENSIONS,
  ASSET_TYPE_BY_EXTENSION,
  MAX_FILE_SIZE_BY_EXTENSION,
};
