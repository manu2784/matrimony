"use strict";

const Joi = require("joi");
const { PERMISSION_ROLES } = require("../../models/Permission");

// function to validate user
function validateUser(user, props) {
  let scheme = {
    _id: Joi.string(),
    firstName: Joi.string().alphanum().min(3).max(30),
    lastName: Joi.string().alphanum().min(3).max(30),
    email: Joi.string().email().required(),
    password: Joi.string().pattern(new RegExp("^[a-zA-Z0-9]{3,30}$")).messages({
      "string.min": "Password must be at least 8 characters long",
      "any.required": "Password is required",
      "string.pattern.base":
        "Password must be at least 8 characters long and include uppercase, lowercase, and a number",
    }),
    orgId: Joi.string(),
    orgType: Joi.string().valid("provider", "tenant"),
    username: Joi.string().alphanum().min(3).max(30),
    phone: Joi.number(),
    roles: Joi.array()
      .items(Joi.string().valid(...PERMISSION_ROLES))
      .min(1),
  };

  if (props && props.length > 0) {
    const partialScheme = {};
    props.map((key) => {
      if (scheme[key]) partialScheme[key] = scheme[key];
    });
    const schema = Joi.object(partialScheme, { stripUnknown: true });
    return schema.validate(user);
  }

  const schema = Joi.object(scheme, { stripUnknown: true });
  return schema.validate(user);
}

module.exports = validateUser;
