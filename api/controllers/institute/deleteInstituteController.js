"use strict";

const mongoose = require("mongoose");
const Institute = require("../../models/Institute");

exports.deleteInstituteController = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid institute id format",
      });
    }

    const institute = await Institute.findByIdAndDelete(id);

    if (!institute) {
      return res.status(404).json({
        success: false,
        message: "Institute not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Institute deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};
