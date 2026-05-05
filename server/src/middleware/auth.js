import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { httpError } from "../utils/httpError.js";

export async function authenticate(req, _res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : req.query.token;

    if (!token) {
      throw httpError(401, "Authentication required.");
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET || "dev-secret");
    const user = await User.findById(payload.sub);

    if (!user) {
      throw httpError(401, "User no longer exists.");
    }

    req.user = user;
    next();
  } catch (error) {
    next(error.status ? error : httpError(401, "Invalid or expired token."));
  }
}

export function requireRole(...roles) {
  return (req, _res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      next(httpError(403, "You do not have permission for this action."));
      return;
    }
    next();
  };
}
