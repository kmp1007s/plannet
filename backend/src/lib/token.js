const jwtSecret = process.env.JWT_SECRET_KEY;
const jwt = require("jsonwebtoken");

function generateToken(payload) {
  return new Promise((resolve, reject) => {
    jwt.sign(
      payload,
      jwtSecret,
      {
        expiresIn: "7d"
      },
      (error, token) => {
        if (error) reject(error);
        resolve(token);
      }
    );
  });
}

function decodeToken(token) {
  return new Promise((resolve, reject) => {
    jwt.verify(token, jwtSecret, (error, decoded) => {
      if (error) reject(error);
      resolve(decoded);
    });
  });
}

async function jwtMiddleware(ctx, next) {
  const token = ctx.cookies.get("access_token");
  if (!token) return next();

  try {
    const decoded = await decodeToken(token);

    // 만료일이 하루밖에 안남으면
    if (Date.now() / 1000 - decoded.iat > 60 * 60 * 24) {
      const { _id, userId, subscription } = decoded;
      const freshToken = await generateToken({ _id, userId, subscription });
      ctx.cookies.set("access_token", freshToken, {
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7days
        httpOnly: true,
        credentials: "include"
      });
    }

    ctx.request.user = decoded;
  } catch (e) {
    // token validate 실패
    ctx.request.user = null;
  }

  return next();
}

module.exports = {
  generateToken,
  decodeToken,
  jwtMiddleware
};
