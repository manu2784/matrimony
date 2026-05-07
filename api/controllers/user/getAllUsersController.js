"use strict";

const mongoose = require("mongoose");
const { Permission } = require("../../models/Permission");
const { User } = require("../../models/User");

exports.getAllUsersController = async (req, res) => {
  try {
    const { page = 1, limit = 20, orgId, search, status } = req.query;
    const filter = {};

    if (orgId) {
      if (!mongoose.Types.ObjectId.isValid(orgId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid orgId format",
        });
      }

      filter.orgId = orgId;
    }

    if (status) {
      filter.status = status;
    }

    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { username: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [users, total] = await Promise.all([
      User.find(filter)
        .select("-password")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      User.countDocuments(filter),
    ]);
    const userIds = users.map((user) => user._id);
    const permissions = await Permission.find({
      userId: { $in: userIds },
      $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
    }).select("userId role scopeType scopeId");

    const permissionsByUserId = permissions.reduce((acc, permission) => {
      const userId = String(permission.userId);
      if (!acc[userId]) acc[userId] = [];
      acc[userId].push(permission);
      return acc;
    }, {});

    const usersWithPermissions = users.map((user) => {
      const userObject = user.toObject();
      const userPermissions = permissionsByUserId[String(user._id)] || [];
      return {
        ...userObject,
        roles: [
          ...new Set(userPermissions.map((permission) => permission.role)),
        ],
        permissions: userPermissions,
      };
    });

    return res.status(200).json({
      success: true,
      data: usersWithPermissions,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)) || 1,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};
