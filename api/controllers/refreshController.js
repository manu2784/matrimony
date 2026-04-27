const hashToken = require("../helpers/hashToken");
const jwt = require("jsonwebtoken");
const getUser = require("../helpers/getUser");
const { RefreshToken } = require("../models/RefreshToken");
const { buildAuthState } = require("../helpers/buildAuthState");
const {
  getAccessCookieOptions,
  getRefreshCookieOptions,
} = require("../helpers/authCookies");

exports.refreshController = async (req, res) => {
  const token = req.cookies.refreshToken;
  if (!token) return res.sendStatus(401);

  try {
    const payload = jwt.verify(token, process.env.refresh_token_private_key);

    const hashed = hashToken(token);
    const user = await getUser(payload._id, []);
    const stored = await RefreshToken.findOne({
      userId: payload._id,
      tokenHash: hashed,
    });

    if (!user || !user.isActive() || !stored) return res.sendStatus(403);

    // Rotate refresh token
    await stored.deleteOne();

    const authState = await buildAuthState(user);
    const newRefreshToken = user.generateRefreshToken();
    const newAccessToken = user.generateAccessToken(authState);

    await RefreshToken.create({
      userId: payload._id,
      tokenHash: hashToken(newRefreshToken),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });

    res.cookie("refreshToken", newRefreshToken, getRefreshCookieOptions());
    res.cookie("accessToken", newAccessToken, getAccessCookieOptions());

    res.json({ accessToken: newAccessToken });
  } catch (err) {
    return res.sendStatus(403);
  }
};
