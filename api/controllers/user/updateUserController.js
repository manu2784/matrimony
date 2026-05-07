"use strict";

const { User } = require("../../models/User");
const { Permission } = require("../../models/Permission");
const validateUser = require("../../modules/validations/validateUser");
const bcrypt = require("bcrypt");
const {
  createPermission,
  PermissionServiceError,
} = require("../../services/permissionService");
const {
  DEFAULT_PERMISSION_ROLE_SCOPE_MAP,
} = require("../../models/Permission");

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
      return {
        userId,
        role,
        scopeType: "org",
        scopeId: body.orgId,
      };
    }

    return {
      userId,
      role,
      scopeType,
      scopeId: body.courseId,
    };
  });
}

exports.updateUserController = async (req, res) => {
  const requestBody = { ...req.body };
  const submittedRoles = Array.isArray(requestBody.roles)
    ? requestBody.roles
    : undefined;
  delete requestBody.roles;
  delete requestBody.courseId;

  const fieldsToValidate = Object.keys(requestBody).filter(
    (field) => !(field === "password" && !requestBody.password),
  );
  const { error } = validateUser(requestBody, fieldsToValidate);
  if (error) return res.status(400).send(error.details[0].message);

  //fields not applicable to updates
  delete requestBody.accountManagerOrgs;
  delete requestBody.adminTeams;
  delete requestBody.permission;
  delete requestBody.org;

  // find an existing user
  let existingUser;
  try {
    existingUser = await User.findById(requestBody._id);
    //  existingUser= existingUser.toObject();
  } catch (e) {
    console.log(e);
  }
  if (!existingUser) return res.status(404).send("User not found");

  const props = Object.keys(User.schema.paths);
  for (let i = 0; i < props.length; i++) {
    let key = props[i];
    if (key === "_id") continue;

    if (requestBody[key]) existingUser[key] = requestBody[key];
  }
  delete existingUser.__v;
  if (requestBody.password)
    existingUser.password = await bcrypt.hash(existingUser.password, 10);

  const savedUser = await existingUser.save();

  if (submittedRoles) {
    try {
      const permissionPayloads = buildPermissionPayloadsForUser(savedUser._id, {
        ...requestBody,
        roles: submittedRoles,
        orgId: requestBody.orgId || savedUser.orgId,
      });

      await Permission.deleteMany({ userId: savedUser._id });

      for (const permissionPayload of permissionPayloads) {
        // eslint-disable-next-line no-await-in-loop
        await createPermission(permissionPayload, {
          actingUserId: req.user?._id,
        });
      }
    } catch (permissionError) {
      if (permissionError instanceof PermissionServiceError) {
        return res
          .status(permissionError.statusCode)
          .json({ error: permissionError.message });
      }

      throw permissionError;
    }
  }

  res.send(savedUser);
};
