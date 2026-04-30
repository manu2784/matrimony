"use strict";

const { User } = require("../models/User");
const { Permission } = require("../models/Permission");
const { ROLE_RANK } = require("./permissionService");

const ORG_USER_MANAGED_ROLES = [
  "orgSuperAdmin",
  "courseAdmin",
  "courseManager",
  "courseViewer",
];

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

function hasOrgScopedRole(permissions, role, orgId) {
  return permissions.some(
    (permission) =>
      permission.role === role &&
      permission.scopeType === "org" &&
      String(permission.scopeId) === String(orgId),
  );
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
    User.findById(userId).select("_id orgType orgId status"),
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

function normalizeRoles(roles) {
  if (!Array.isArray(roles)) {
    return [];
  }

  return roles.map((role) => String(role).trim()).filter(Boolean);
}

async function prepareUserRegistrationBody(userId, body) {
  if (!userId) {
    return body;
  }

  const { user, permissions } = await getAuthorizationContext(userId);
  const roles = normalizeRoles(body.roles);

  if (
    hasHighestSuperAdminPermission(permissions) ||
    (user.orgType === "provider" && hasRole(permissions, "accountAdmin"))
  ) {
    return body;
  }

  if (!hasOrgScopedRole(permissions, "orgSuperAdmin", user.orgId)) {
    throw new AuthorizationServiceError(
      "Only org super admins can create users for their organization",
      403,
    );
  }

  if (!user.orgId || !user.orgType) {
    throw new AuthorizationServiceError(
      "Authenticated user must belong to an organization",
      403,
    );
  }

  if (!roles.length) {
    throw new AuthorizationServiceError(
      "At least one role is required when creating an organization user",
      400,
    );
  }

  const unsupportedRole = roles.find(
    (role) => !ORG_USER_MANAGED_ROLES.includes(role),
  );

  if (unsupportedRole) {
    throw new AuthorizationServiceError(
      `Org super admins cannot assign role "${unsupportedRole}"`,
      403,
    );
  }

  return {
    ...body,
    roles,
    orgId: String(user.orgId),
    orgType: user.orgType,
  };
}

async function prepareCourseCreationBody(userId, body) {
  const { user, permissions } = await getAuthorizationContext(userId);

  if (
    hasHighestSuperAdminPermission(permissions) ||
    (user.orgType === "provider" && hasRole(permissions, "accountAdmin"))
  ) {
    return body;
  }

  if (!user.orgId || !user.orgType) {
    throw new AuthorizationServiceError(
      "Authenticated user must belong to an organization",
      403,
    );
  }

  const canCreateForOrg =
    hasOrgScopedRole(permissions, "orgSuperAdmin", user.orgId) ||
    hasOrgScopedRole(permissions, "courseAdmin", user.orgId);

  if (!canCreateForOrg) {
    throw new AuthorizationServiceError(
      "Only org super admins and course admins can create courses for their organization",
      403,
    );
  }

  if (!body.courseAdminId) {
    throw new AuthorizationServiceError("courseAdminId is required", 400);
  }

  const courseAdmin = await User.findById(body.courseAdminId).select(
    "_id orgId status",
  );

  if (!courseAdmin) {
    throw new AuthorizationServiceError("Course admin user was not found", 404);
  }

  if (String(courseAdmin.orgId) !== String(user.orgId)) {
    throw new AuthorizationServiceError(
      "Course admin must belong to the creator's organization",
      403,
    );
  }

  return {
    ...body,
    instituteId: String(user.orgId),
  };
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
  ORG_USER_MANAGED_ROLES,
  canManageInstitutes,
  ensureCanManageInstitutes,
  authorizeInstituteManagement,
  prepareUserRegistrationBody,
  prepareCourseCreationBody,
};
