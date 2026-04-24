"use strict";

const permissionService = require("../../services/permissionService");

function handlePermissionError(res, error) {
  if (error instanceof permissionService.PermissionServiceError) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
    });
  }

  if (error && error.code === 11000) {
    return res.status(409).json({
      success: false,
      message: "This permission already exists for the selected user and scope",
    });
  }

  if (error && error.name === "ValidationError") {
    const errors = Object.values(error.errors).map((item) => item.message);
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors,
    });
  }

  return res.status(500).json({
    success: false,
    message: "Internal server error",
    error: error.message,
  });
}

exports.listPermissionsController = async (req, res) => {
  try {
    const result = await permissionService.listPermissions(req.query);

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    return handlePermissionError(res, error);
  }
};

exports.getPermissionController = async (req, res) => {
  try {
    const permission = await permissionService.getPermissionById(req.params.id);

    return res.status(200).json({
      success: true,
      data: permission,
    });
  } catch (error) {
    return handlePermissionError(res, error);
  }
};

exports.createPermissionController = async (req, res) => {
  try {
    const permission = await permissionService.createPermission(req.body, {
      actingUserId: req.user?._id,
    });

    return res.status(201).json({
      success: true,
      message: "Permission created successfully",
      data: permission,
    });
  } catch (error) {
    return handlePermissionError(res, error);
  }
};

exports.updatePermissionController = async (req, res) => {
  try {
    const permission = await permissionService.updatePermission(
      req.params.id,
      req.body,
      {
        actingUserId: req.user?._id,
      },
    );

    return res.status(200).json({
      success: true,
      message: "Permission updated successfully",
      data: permission,
    });
  } catch (error) {
    return handlePermissionError(res, error);
  }
};

exports.deletePermissionController = async (req, res) => {
  try {
    const permission = await permissionService.deletePermission(req.params.id, {
      actingUserId: req.user?._id,
    });

    return res.status(200).json({
      success: true,
      message: "Permission deleted successfully",
      data: permission,
    });
  } catch (error) {
    return handlePermissionError(res, error);
  }
};
