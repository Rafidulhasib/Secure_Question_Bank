import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User, { USER_ROLES } from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { httpError } from "../utils/httpError.js";

function signToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      role: user.role
    },
    process.env.JWT_SECRET || "dev-secret",
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
}

export const login = asyncHandler(async (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");

  if (!email || !password) {
    throw httpError(422, "Email and password are required.");
  }

  const user = await User.findOne({ email }).select("+passwordHash");
  if (!user) {
    throw httpError(401, "Invalid email or password.");
  }

  const matches = await bcrypt.compare(password, user.passwordHash);
  if (!matches) {
    throw httpError(401, "Invalid email or password.");
  }

  res.json({
    token: signToken(user),
    user
  });
});

export const register = asyncHandler(async (req, res) => {
  const name = String(req.body.name || "").trim();
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");

  if (!name || !email || password.length < 8) {
    throw httpError(422, "Name, email, and an 8 character password are required.");
  }

  const exists = await User.exists({ email });
  if (exists) {
    throw httpError(409, "Email already exists.");
  }

  const user = await User.create({
    name,
    email,
    role: "User",
    emailVerifiedAt: new Date(),
    passwordHash: await bcrypt.hash(password, 12)
  });

  res.status(201).json({
    token: signToken(user),
    user
  });
});

export const me = asyncHandler(async (req, res) => {
  res.json({ user: req.user });
});

export function validateRole(role) {
  if (!USER_ROLES.includes(role)) {
    throw httpError(422, "Invalid user role.");
  }
}
