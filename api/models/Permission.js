"use strict";

const mongoose = require("mongoose");

const { Schema } = mongoose;

const ROLES = [
  "superAdmin",
  "accountAdmin",
  "accountManager",
  "orgSuperAdmin",
  "courseAdmin",
  "courseManager",
  "courseViewer",
];

const SCOPE_TYPES = ["global", "org", "course"];

const ROLE_SCOPE_MAP = {
  superAdmin: "global",
  accountAdmin: "org",
  accountManager: "org",
  orgSuperAdmin: "org",
  courseAdmin: "course",
  courseManager: "course",
  courseViewer: "course",
};

const permissionSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: ROLES,
      required: true,
    },
    scopeType: {
      type: String,
      enum: SCOPE_TYPES,
      required: true,
    },
    scopeId: {
      type: Schema.Types.ObjectId,
      default: null,
    },
    grantedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

permissionSchema.index({ userId: 1, scopeType: 1, scopeId: 1 });
permissionSchema.index({ scopeId: 1, role: 1 });
permissionSchema.index({ role: 1, scopeId: 1 });
permissionSchema.index(
  { userId: 1, role: 1, scopeType: 1, scopeId: 1 },
  { unique: true },
);

permissionSchema.pre("validate", function validatePermission(next) {
  const expectedScope = ROLE_SCOPE_MAP[this.role];

  if (this.scopeType !== expectedScope) {
    return next(
      new Error(
        `Role "${this.role}" must have scopeType "${expectedScope}", got "${this.scopeType}"`,
      ),
    );
  }

  if (this.scopeType === "global" && this.scopeId !== null) {
    return next(new Error("Global scope must have scopeId null"));
  }

  if (this.scopeType !== "global" && !this.scopeId) {
    return next(new Error(`scopeType "${this.scopeType}" requires a scopeId`));
  }

  return next();
});

permissionSchema.methods.isExpired = function isExpired() {
  if (!this.expiresAt) return false;
  return new Date() > this.expiresAt;
};

permissionSchema.statics.getForUser = function getForUser(userId) {
  return this.find({
    userId,
    $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
  });
};

permissionSchema.statics.hasPermission = function hasPermission(
  userId,
  role,
  scopeId = null,
) {
  return this.exists({
    userId,
    role,
    scopeId,
    $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
  });
};

permissionSchema.statics.hasAnyRole = function hasAnyRole(
  userId,
  roles,
  scopeId = null,
) {
  return this.exists({
    userId,
    role: { $in: roles },
    scopeId,
    $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
  });
};

permissionSchema.statics.getUsersWithRole = function getUsersWithRole(
  role,
  scopeId = null,
) {
  return this.find({ role, scopeId }).populate(
    "userId",
    "firstName lastName email username",
  );
};

const Permission = mongoose.model("Permission", permissionSchema);

module.exports = {
  Permission,
  PERMISSION_ROLES: ROLES,
  PERMISSION_SCOPE_TYPES: SCOPE_TYPES,
  PERMISSION_ROLE_SCOPE_MAP: ROLE_SCOPE_MAP,
};
