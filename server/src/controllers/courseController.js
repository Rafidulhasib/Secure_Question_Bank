import Course from "../models/Course.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { httpError } from "../utils/httpError.js";
import { getPagination, paginationMeta } from "../utils/pagination.js";

function parseBoolean(value) {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }
  return value === true || value === "true" || value === "1" || value === 1;
}

function buildCourseFilter(query, user) {
  const filter = {};
  const wantsDeleted = query.deleted === "true";

  if (wantsDeleted) {
    if (user.role !== "SuperAdmin") {
      throw httpError(403, "Only SuperAdmin can view trashed courses.");
    }
    filter.deletedAt = { $ne: null };
  } else {
    filter.deletedAt = null;
  }

  const active = parseBoolean(query.active);
  if (active !== undefined) {
    filter.isActive = active;
  } else if (user.role !== "SuperAdmin") {
    filter.isActive = true;
  }

  if (query.search) {
    const term = new RegExp(String(query.search).trim(), "i");
    filter.$or = [{ title: term }, { code: term }];
  }

  return filter;
}

export const listCourses = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = buildCourseFilter(req.query, req.user);

  const [courses, total] = await Promise.all([
    Course.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Course.countDocuments(filter)
  ]);

  res.json({
    data: courses,
    meta: paginationMeta(total, page, limit)
  });
});

export const createCourse = asyncHandler(async (req, res) => {
  const title = String(req.body.title || "").trim();
  const code = String(req.body.code || "").trim().toUpperCase();

  if (!title || !code) {
    throw httpError(422, "Course title and code are required.");
  }

  const course = await Course.create({
    title,
    code,
    isActive: parseBoolean(req.body.isActive) ?? true
  });

  res.status(201).json({ data: course });
});

export const updateCourse = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id);
  if (!course || course.deletedAt) {
    throw httpError(404, "Course not found.");
  }

  const title = String(req.body.title || "").trim();
  const code = String(req.body.code || "").trim().toUpperCase();

  if (!title || !code) {
    throw httpError(422, "Course title and code are required.");
  }

  course.title = title;
  course.code = code;
  course.isActive = parseBoolean(req.body.isActive) ?? false;
  await course.save();

  res.json({ data: course });
});

export const deleteCourse = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id);
  if (!course || course.deletedAt) {
    throw httpError(404, "Course not found.");
  }

  course.deletedAt = new Date();
  await course.save();
  res.json({ message: "Course moved to trash." });
});

export const restoreCourse = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id);
  if (!course) {
    throw httpError(404, "Course not found.");
  }

  course.deletedAt = null;
  await course.save();
  res.json({ data: course, message: "Course restored successfully." });
});

export const forceDeleteCourse = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id);
  if (!course) {
    throw httpError(404, "Course not found.");
  }

  await course.deleteOne();
  res.json({ message: "Course permanently deleted." });
});
