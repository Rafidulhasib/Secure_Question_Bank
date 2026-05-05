import bcrypt from "bcryptjs";
import User from "../models/User.js";
import { validateRole } from "./authController.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { httpError } from "../utils/httpError.js";
import { getPagination, paginationMeta } from "../utils/pagination.js";

function userFilter(query) {
  const filter = {};
  if (query.role) {
    validateRole(query.role);
    filter.role = query.role;
  }
  if (query.search) {
    const term = new RegExp(String(query.search).trim(), "i");
    filter.$or = [{ name: term }, { email: term }];
  }
  return filter;
}

export const listUsers = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = userFilter(req.query);

  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(filter)
  ]);

  res.json({
    data: users,
    meta: paginationMeta(total, page, limit)
  });
});

export const createUser = asyncHandler(async (req, res) => {
  const name = String(req.body.name || "").trim();
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");
  const role = String(req.body.role || "User");

  validateRole(role);
  if (!name || !email || password.length < 8) {
    throw httpError(422, "Name, email, role, and an 8 character password are required.");
  }

  const exists = await User.exists({ email });
  if (exists) {
    throw httpError(409, "Email already exists.");
  }

  const user = await User.create({
    name,
    email,
    role,
    emailVerifiedAt: new Date(),
    passwordHash: await bcrypt.hash(password, 12)
  });

  res.status(201).json({ data: user });
});

export const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select("+passwordHash");
  if (!user) {
    throw httpError(404, "User not found.");
  }

  const name = String(req.body.name || "").trim();
  const email = String(req.body.email || "").trim().toLowerCase();

  if (!name || !email) {
    throw httpError(422, "Name and email are required.");
  }

  const emailExists = await User.exists({ email, _id: { $ne: user._id } });
  if (emailExists) {
    throw httpError(409, "Email already exists.");
  }

  user.name = name;
  user.email = email;

  if (req.body.role) {
    validateRole(req.body.role);
    user.role = req.body.role;
  }

  if (req.body.password) {
    if (String(req.body.password).length < 8) {
      throw httpError(422, "Password must be at least 8 characters.");
    }
    user.passwordHash = await bcrypt.hash(String(req.body.password), 12);
  }

  if (req.file) {
    user.imgUrl = `/uploads/profile_pics/${req.file.filename}`;
  }

  await user.save();
  res.json({ data: user });
});

export const updateMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select("+passwordHash");
  if (!user) {
    throw httpError(404, "User not found.");
  }

  const name = String(req.body.name || "").trim();
  const email = String(req.body.email || "").trim().toLowerCase();

  if (!name || !email) {
    throw httpError(422, "Name and email are required.");
  }

  const emailExists = await User.exists({ email, _id: { $ne: user._id } });
  if (emailExists) {
    throw httpError(409, "Email already exists.");
  }

  user.name = name;
  user.email = email;

  if (req.body.password) {
    if (String(req.body.password).length < 8) {
      throw httpError(422, "Password must be at least 8 characters.");
    }
    user.passwordHash = await bcrypt.hash(String(req.body.password), 12);
  }

  if (req.file) {
    user.imgUrl = `/uploads/profile_pics/${req.file.filename}`;
  }

  await user.save();
  res.json({ data: user });
});

export const deleteUser = asyncHandler(async (req, res) => {
  if (req.params.id === req.user.id) {
    throw httpError(422, "You cannot delete your own account.");
  }

  const user = await User.findById(req.params.id);
  if (!user) {
    throw httpError(404, "User not found.");
  }

  await user.deleteOne();
  res.json({ message: "User deleted successfully." });
});
