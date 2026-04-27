"use strict";

const { Permission } = require("../models/Permission");

function serializePermission(permission) {
  return {
    _id: String(permission._id),
    role: permission.role,
    scopeType: permission.scopeType,
    scopeId: permission.scopeId ? String(permission.scopeId) : null,
    expiresAt: permission.expiresAt || null,
  };
}

function serializeUser(user) {
  return {
    _id: String(user._id),
    firstName: user.firstName || "",
    lastName: user.lastName || "",
    email: user.email,
    username: user.username || "",
    orgType: user.orgType || null,
    orgId: user.orgId ? String(user.orgId) : null,
    status: user.status || null,
  };
}

async function buildAuthState(user) {
  const permissions = await Permission.getForUser(user._id);
  const serializedPermissions = permissions.map(serializePermission);
  const roles = [
    ...new Set(serializedPermissions.map((permission) => permission.role)),
  ];

  return {
    user: serializeUser(user),
    orgType: user.orgType || null,
    roles,
    permissions: serializedPermissions,
  };
}

module.exports = {
  buildAuthState,
};
