const hashToken = require("../helpers/hashToken");
const jwt = require("jsonwebtoken");
const getUser = require("../helpers/getUser");
const { RefreshToken } = require("../models/RefreshToken");

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: false,
  sameSite: "lax",
  path: "/",
};

exports.refreshController = async (req, res) => {
  const token = req.cookies.refreshToken;
  if (!token) return res.sendStatus(401);

  try {
    const payload = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);

    const hashed = hashToken(token);
    const user = await getUser(payload.userId, []);
    const stored = await RefreshToken.findOne({
      userId: payload.userId,
      tokenHash: hashed,
    });

    if (!user || !user.isActive() || !stored) return res.sendStatus(403);

    // Rotate refresh token
    await stored.deleteOne();

    const newRefreshToken = user.generateRefreshToken();
    const newAccessToken = user.generateAccessToken();

    await RefreshToken.create({
      userId: payload.userId,
      tokenHash: hashToken(newRefreshToken),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });

    res.cookie("refreshToken", newRefreshToken, {
      ...COOKIE_OPTIONS,
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    res.send(newAccessToken);
  } catch (err) {
    return res.sendStatus(403);
  }
};
