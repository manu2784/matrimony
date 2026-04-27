"use strict";

const { User } = require("../models/User");
const { Permission } = require("../models/Permission");
const { ROLE_RANK } = require("./permissionService");

class AuthorizationServiceError extends Error {
  constructor(message, statusCode = 403) {
    super(message);
    this.name = "AuthorizationServiceError";
    this.statusCode = statusCode;
  }
}

function hasRole(permissions, role) {
  return permissions.some((permission) => permission.role === role);
}

function hasHighestSuperAdminPermission(permissions) {
  const highestRank = Math.max(...Object.values(ROLE_RANK));

  return permissions.some(
    (permission) =>
      permission.role === "superAdmin" &&
      permission.scopeType === "global" &&
      ROLE_RANK[permission.role] === highestRank,
  );
}

async function getAuthorizationContext(userId) {
  if (!userId) {
    throw new AuthorizationServiceError("Authentication is required", 401);
  }

  const [user, permissions] = await Promise.all([
    User.findById(userId).select("_id orgType status"),
    Permission.getForUser(userId),
  ]);

  if (!user) {
    throw new AuthorizationServiceError(
      "Authenticated user was not found",
      401,
    );
  }

  return { user, permissions };
}

async function canManageInstitutes(userId) {
  const { user, permissions } = await getAuthorizationContext(userId);

  if (hasHighestSuperAdminPermission(permissions)) {
    return true;
  }

  return user.orgType === "provider" && hasRole(permissions, "accountAdmin");
}

async function ensureCanManageInstitutes(userId) {
  if (await canManageInstitutes(userId)) {
    return;
  }

  throw new AuthorizationServiceError(
    "Only highest super admins and provider account admins can manage institutes",
    403,
  );
}

function authorizeInstituteManagement() {
  return async function authorizeInstituteManagementMiddleware(req, res, next) {
    try {
      await ensureCanManageInstitutes(req.user?._id);
      return next();
    } catch (error) {
      if (error instanceof AuthorizationServiceError) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
      }

      return res.status(500).json({
        success: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  };
}

module.exports = {
  AuthorizationServiceError,
  canManageInstitutes,
  ensureCanManageInstitutes,
  authorizeInstituteManagement,
};
