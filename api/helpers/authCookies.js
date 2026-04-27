"use strict";

const BASE_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
};

function getRefreshCookieOptions() {
  return {
    ...BASE_COOKIE_OPTIONS,
    maxAge: 30 * 24 * 60 * 60 * 1000,
  };
}

function getAccessCookieOptions() {
  return {
    ...BASE_COOKIE_OPTIONS,
  };
}

module.exports = {
  getAccessCookieOptions,
  getRefreshCookieOptions,
};
