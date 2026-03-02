import jwt from "jsonwebtoken";
import User from "../models/User.js";

const getTokenFromCookies = (cookieHeader) => {
  if (!cookieHeader) return null;
  const pairs = cookieHeader.split(";").map((item) => item.trim());
  const tokenPair = pairs.find((item) => item.startsWith("token="));
  if (!tokenPair) return null;
  return decodeURIComponent(tokenPair.slice("token=".length));
};

const authMiddleware = async (req, res, next) => {
  try {
    let token;

    // Check Authorization header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    // Fallback to cookie auth
    if (!token) {
      token = getTokenFromCookies(req.headers.cookie);
    }

    if (!token) {
      return res.status(401).json({ message: "Not authorized, no token" });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user to request
    req.user = await User.findById(decoded.id).populate("role");

    if (!req.user) {
      return res.status(401).json({ message: "User not found" });
    }
    if (!req.user.isActive) {
      return res.status(403).json({ message: "Access denied. Your account is inactive." });
    }

    next();
  } catch (error) {
    return res.status(401).json({ message: "Token failed" });
  }
};

export default authMiddleware;
