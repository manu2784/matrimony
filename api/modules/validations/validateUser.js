"use strict";
// const Joi = require("@hapi/joi");

const Joi = require("joi");

// function to validate user
function validateUser(user, props) {
  let scheme = {
    _id: Joi.string(),
    firstName: Joi.string().alphanum().min(3).max(30),
    lastName: Joi.string().alphanum().min(3).max(30),
    email: Joi.string().email().required(),
    password: Joi.string().pattern(new RegExp("^[a-zA-Z0-9]{3,30}$")),
    org: Joi.string(),
    accountManagerOrgs: Joi.array().items(Joi.string()).min(1),
    rosters: Joi.array().items(Joi.string()),
    // status: Joi.string().valid('enabled', 'disabled').required(),
    teams: Joi.array().items(Joi.string()),
    availability: Joi.object(),
    acceptedTC: Joi.boolean(),
    location: Joi.string(),
    roles: Joi.array(),
    blocked: Joi.boolean(),
    adminTeams: Joi.array().items(Joi.string()),
    phone: Joi.number(),
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
