"use strict";

const mongoose = require("mongoose");
const {
  Permission,
  PERMISSION_ROLES,
  PERMISSION_SCOPE_TYPES,
  PERMISSION_ROLE_SCOPE_MAP,
} = require("../models/Permission");

const ROLE_RANK = {
  superAdmin: 700,
  accountAdmin: 600,
  orgSuperAdmin: 500,
  accountManager: 400,
  courseAdmin: 300,
  courseManager: 200,
  courseViewer: 100,
};

class PermissionServiceError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.name = "PermissionServiceError";
    this.statusCode = statusCode;
  }
}

function isValidObjectId(value) {
  return mongoose.Types.ObjectId.isValid(value);
}

function toObjectId(value, fieldName) {
  if (!value || !isValidObjectId(value)) {
    throw new PermissionServiceError(`Invalid ${fieldName} format`, 400);
  }

  return new mongoose.Types.ObjectId(value);
}

function areObjectIdsEqual(left, right) {
  if (left === null && right === null) return true;
  if (!left || !right) return false;
  return String(left) === String(right);
}

function normalizeScopeId(scopeType, scopeId) {
  if (scopeType === "global") {
    return null;
  }

  return toObjectId(scopeId, "scopeId");
}

function normalizeExpiresAt(expiresAt) {
  if (expiresAt === undefined) return undefined;
  if (expiresAt === null || expiresAt === "") return null;

  const date = new Date(expiresAt);
  if (Number.isNaN(date.getTime())) {
    throw new PermissionServiceError("Invalid expiresAt format", 400);
  }

  return date;
}

function validateRoleAndScope(role, scopeType) {
  if (!PERMISSION_ROLES.includes(role)) {
    throw new PermissionServiceError("Invalid role", 400);
  }

  if (!PERMISSION_SCOPE_TYPES.includes(scopeType)) {
    throw new PermissionServiceError("Invalid scopeType", 400);
  }

  const allowedScopeTypes = PERMISSION_ROLE_SCOPE_MAP[role] || [];
  if (!allowedScopeTypes.includes(scopeType)) {
    throw new PermissionServiceError(
      `Role "${role}" must use one of scopeTypes "${allowedScopeTypes.join(
        ", ",
      )}"`,
      400,
    );
  }
}

async function resolveCourseInstituteId(courseId) {
  if (!courseId) return null;

  const db = mongoose.connection.db;
  if (!db) {
    throw new PermissionServiceError("Database connection is not ready", 500);
  }

  const course = await db
    .collection("courses")
    .findOne(
      { _id: toObjectId(courseId, "courseId") },
      { projection: { instituteId: 1 } },
    );

  if (!course) {
    throw new PermissionServiceError(
      "Course not found for the provided scope",
      404,
    );
  }

  if (!course.instituteId) {
    throw new PermissionServiceError(
      "Course does not belong to an institute",
      400,
    );
  }

  return course.instituteId;
}

async function canPermissionManageTarget(
  actingPermission,
  targetRole,
  targetScopeType,
  targetScopeId,
) {
  const actingRank = ROLE_RANK[actingPermission.role] || 0;
  const targetRank = ROLE_RANK[targetRole] || 0;

  if (
    actingPermission.role === "orgSuperAdmin" &&
    targetRole === "orgSuperAdmin" &&
    actingPermission.scopeType === "org" &&
    targetScopeType === "org" &&
    areObjectIdsEqual(actingPermission.scopeId, targetScopeId)
  ) {
    return true;
  }

  if (
    actingPermission.role === "courseAdmin" &&
    targetRole === "courseAdmin" &&
    actingPermission.scopeType === "org" &&
    targetScopeType === "course"
  ) {
    const instituteId = await resolveCourseInstituteId(targetScopeId);
    return areObjectIdsEqual(actingPermission.scopeId, instituteId);
  }

  if (actingRank <= targetRank) {
    return false;
  }

  if (actingPermission.scopeType === "global") {
    return true;
  }

  if (targetScopeType === "global") {
    return false;
  }

  if (
    actingPermission.scopeType === targetScopeType &&
    areObjectIdsEqual(actingPermission.scopeId, targetScopeId)
  ) {
    return true;
  }

  if (actingPermission.scopeType === "org" && targetScopeType === "course") {
    const instituteId = await resolveCourseInstituteId(targetScopeId);
    return areObjectIdsEqual(actingPermission.scopeId, instituteId);
  }

  return false;
}

async function ensureActingUserCanManage({
  actingUserId,
  targetRole,
  targetScopeType,
  targetScopeId,
  allowBootstrap = false,
}) {
  if (!actingUserId) {
    if (
      allowBootstrap &&
      targetRole === "superAdmin" &&
      targetScopeType === "global"
    ) {
      return;
    }

    throw new PermissionServiceError(
      "An authenticated user with higher permissions is required",
      403,
    );
  }

  const actingPermissions = await Permission.getForUser(actingUserId);
  for (const actingPermission of actingPermissions) {
    // eslint-disable-next-line no-await-in-loop
    const canManage = await canPermissionManageTarget(
      actingPermission,
      targetRole,
      targetScopeType,
      targetScopeId,
    );

    if (canManage) {
      return;
    }
  }

  throw new PermissionServiceError(
    "Permission can only be granted or changed by a user with higher permissions",
    403,
  );
}

function buildListQuery(filters = {}) {
  const query = {};

  if (filters.userId) {
    query.userId = toObjectId(filters.userId, "userId");
  }

  if (filters.role) {
    if (!PERMISSION_ROLES.includes(filters.role)) {
      throw new PermissionServiceError("Invalid role filter", 400);
    }
    query.role = filters.role;
  }

  if (filters.scopeType) {
    if (!PERMISSION_SCOPE_TYPES.includes(filters.scopeType)) {
      throw new PermissionServiceError("Invalid scopeType filter", 400);
    }
    query.scopeType = filters.scopeType;
  }

  if (filters.scopeId) {
    query.scopeId = toObjectId(filters.scopeId, "scopeId");
  } else if (filters.scopeType === "global") {
    query.scopeId = null;
  }

  if (filters.grantedBy) {
    query.grantedBy = toObjectId(filters.grantedBy, "grantedBy");
  }

  if (filters.includeExpired !== "true" && filters.includeExpired !== true) {
    query.$or = [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }];
  }

  return query;
}

function normalizePermissionPayload(payload, { partial = false } = {}) {
  const normalized = {};

  if (!partial || payload.userId !== undefined) {
    normalized.userId = toObjectId(payload.userId, "userId");
  }

  if (!partial || payload.role !== undefined) {
    normalized.role = payload.role;
  }

  if (!partial || payload.scopeType !== undefined) {
    normalized.scopeType = payload.scopeType;
  }

  const finalRole = normalized.role ?? payload.role;
  const finalScopeType = normalized.scopeType ?? payload.scopeType;

  if (!partial || finalRole !== undefined || finalScopeType !== undefined) {
    validateRoleAndScope(finalRole, finalScopeType);
  }

  if (
    !partial ||
    payload.scopeId !== undefined ||
    finalScopeType === "global"
  ) {
    normalized.scopeId = normalizeScopeId(finalScopeType, payload.scopeId);
  }

  if (!partial || payload.grantedBy !== undefined) {
    normalized.grantedBy =
      payload.grantedBy === null ||
      payload.grantedBy === undefined ||
      payload.grantedBy === ""
        ? null
        : toObjectId(payload.grantedBy, "grantedBy");
  }

  if (!partial || payload.expiresAt !== undefined) {
    normalized.expiresAt = normalizeExpiresAt(payload.expiresAt);
  }

  return normalized;
}

async function getPermissionById(permissionId) {
  const permission = await Permission.findById(
    toObjectId(permissionId, "permissionId"),
  )
    .populate("userId", "firstName lastName email username")
    .populate("grantedBy", "firstName lastName email username");

  if (!permission) {
    throw new PermissionServiceError("Permission not found", 404);
  }

  return permission;
}

async function listPermissions(filters = {}) {
  const page = Math.max(Number(filters.page) || 1, 1);
  const limit = Math.max(Number(filters.limit) || 20, 1);
  const skip = (page - 1) * limit;
  const query = buildListQuery(filters);

  const [permissions, total] = await Promise.all([
    Permission.find(query)
      .populate("userId", "firstName lastName email username")
      .populate("grantedBy", "firstName lastName email username")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Permission.countDocuments(query),
  ]);

  return {
    data: permissions,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
}

async function createPermission(payload, options = {}) {
  const normalized = normalizePermissionPayload(payload);

  await ensureActingUserCanManage({
    actingUserId: options.actingUserId,
    targetRole: normalized.role,
    targetScopeType: normalized.scopeType,
    targetScopeId: normalized.scopeId,
    allowBootstrap: options.allowBootstrap === true,
  });

  const permission = await Permission.create({
    ...normalized,
    grantedBy: options.actingUserId || normalized.grantedBy || null,
  });

  return getPermissionById(permission._id);
}

async function updatePermission(permissionId, payload, options = {}) {
  const permission = await Permission.findById(
    toObjectId(permissionId, "permissionId"),
  );

  if (!permission) {
    throw new PermissionServiceError("Permission not found", 404);
  }

  await ensureActingUserCanManage({
    actingUserId: options.actingUserId,
    targetRole: permission.role,
    targetScopeType: permission.scopeType,
    targetScopeId: permission.scopeId,
  });

  const mergedPayload = {
    userId: payload.userId ?? permission.userId,
    role: payload.role ?? permission.role,
    scopeType: payload.scopeType ?? permission.scopeType,
    scopeId:
      payload.scopeType === "global"
        ? null
        : (payload.scopeId ?? permission.scopeId),
    grantedBy:
      payload.grantedBy !== undefined
        ? payload.grantedBy
        : permission.grantedBy,
    expiresAt:
      payload.expiresAt !== undefined
        ? payload.expiresAt
        : permission.expiresAt,
  };

  const normalized = normalizePermissionPayload(mergedPayload);

  await ensureActingUserCanManage({
    actingUserId: options.actingUserId,
    targetRole: normalized.role,
    targetScopeType: normalized.scopeType,
    targetScopeId: normalized.scopeId,
  });

  Object.assign(permission, normalized, {
    grantedBy:
      options.actingUserId ||
      normalized.grantedBy ||
      permission.grantedBy ||
      null,
  });

  await permission.save();

  return getPermissionById(permission._id);
}

async function deletePermission(permissionId, options = {}) {
  const permission = await Permission.findById(
    toObjectId(permissionId, "permissionId"),
  );

  if (!permission) {
    throw new PermissionServiceError("Permission not found", 404);
  }

  await ensureActingUserCanManage({
    actingUserId: options.actingUserId,
    targetRole: permission.role,
    targetScopeType: permission.scopeType,
    targetScopeId: permission.scopeId,
  });

  await permission.deleteOne();

  return permission;
}

module.exports = {
  ROLE_RANK,
  PermissionServiceError,
  listPermissions,
  getPermissionById,
  createPermission,
  updatePermission,
  deletePermission,
  ensureActingUserCanManage,
};
