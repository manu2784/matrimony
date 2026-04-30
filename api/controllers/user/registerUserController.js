"use strict";

const { User } = require("../../models/User");
const validateUser = require("../../modules/validations/validateUser");
const bcrypt = require("bcrypt");
const { existingUser } = require("../../helpers/userUtils");
const {
  createPermission,
  deletePermission,
  PermissionServiceError,
} = require("../../services/permissionService");
const {
  DEFAULT_PERMISSION_ROLE_SCOPE_MAP,
} = require("../../models/Permission");
const {
  AuthorizationServiceError,
  prepareUserRegistrationBody,
} = require("../../services/authorizationService");

function buildPermissionPayloadsForUser(userId, body) {
  const roles = Array.isArray(body.roles)
    ? body.roles.map((role) => String(role).trim()).filter(Boolean)
    : [];

  return roles.map((role) => {
    let scopeType = DEFAULT_PERMISSION_ROLE_SCOPE_MAP[role];

    if (!scopeType) {
      throw new PermissionServiceError(`Unsupported role "${role}"`, 400);
    }

    if (body.courseId && role.startsWith("course")) {
      scopeType = "course";
    }

    if (scopeType === "global") {
      return {
        userId,
        role,
        scopeType,
        scopeId: null,
      };
    }

    if (scopeType === "org") {
      if (!body.orgId) {
        throw new PermissionServiceError(
          `Role "${role}" requires an orgId scope`,
          400,
        );
      }

      return {
        userId,
        role,
        scopeType,
        scopeId: body.orgId,
      };
    }

    if (!body.courseId) {
      throw new PermissionServiceError(
        `Role "${role}" requires a courseId scope`,
        400,
      );
    }

    return {
      userId,
      role,
      scopeType,
      scopeId: body.courseId,
    };
  });
}

exports.registerUserController = async (req, res) => {
  try {
    const registrationBody = await prepareUserRegistrationBody(
      req.user?._id,
      req.body,
    );

    const { error } = validateUser(registrationBody);
    if (error) return res.status(400).json({ error: error.details[0].message });

    if (await existingUser("email", registrationBody.email)) {
      return res.status(400).send("User already registered.");
    }

    const permissionPayloads = buildPermissionPayloadsForUser(
      undefined,
      registrationBody,
    );

    const user = new User(registrationBody);

    if (user.password) {
      user.password = await bcrypt.hash(user.password, 10);
    }

    user.status = "enabled";
    await user.save();

    const createdPermissionIds = [];

    try {
      for (const permissionPayload of permissionPayloads) {
        // eslint-disable-next-line no-await-in-loop
        const permission = await createPermission(
          {
            ...permissionPayload,
            userId: user._id,
          },
          {
            actingUserId: req.user?._id,
          },
        );

        createdPermissionIds.push(permission._id);
      }
    } catch (errorCreatingPermission) {
      for (const permissionId of createdPermissionIds) {
        try {
          // eslint-disable-next-line no-await-in-loop
          await deletePermission(permissionId, {
            actingUserId: req.user?._id,
          });
        } catch {
          // Best effort rollback for partially created permission records.
        }
      }

      await User.findByIdAndDelete(user._id);
      throw errorCreatingPermission;
    }

    if (!user.isActive()) {
      return res.send({
        _id: user._id,
        email: user.email,
      });
    }

    const token = user.generateAccessToken();
    return res.header("x-auth-token", token).send({
      _id: user._id,
      email: user.email,
    });
  } catch (error) {
    if (
      error instanceof PermissionServiceError ||
      error instanceof AuthorizationServiceError
    ) {
      return res.status(error.statusCode).json({ error: error.message });
    }

    if (error && error.code === 11000) {
      return res.status(409).json({
        error: "A permission for this user and scope already exists.",
      });
    }

    return res.status(500).json({
      error: error.message || "Unable to register user.",
    });
  }
};
