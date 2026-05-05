import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import Course from "../models/Course.js";
import Question, { ACCESS_POLICIES, REVIEW_STATUSES } from "../models/Question.js";
import User from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { httpError } from "../utils/httpError.js";
import { deleteStoredFile, fileDocument, uploadPath } from "../utils/uploads.js";
import { getPagination, paginationMeta } from "../utils/pagination.js";

function parseBoolean(value) {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }
  return value === true || value === "true" || value === "1" || value === 1;
}

function ownerCanManage(user, question) {
  return user.role === "SuperAdmin" || String(question.owner?._id || question.owner) === user.id;
}

function assertQuestionManager(req, question) {
  if (!ownerCanManage(req.user, question)) {
    throw httpError(403, "You can only manage your own questions.");
  }
}

function normalizeReviewStatus(status) {
  if (!status) {
    return undefined;
  }

  const normalized = String(status).toLowerCase();
  if (!REVIEW_STATUSES.includes(normalized)) {
    throw httpError(422, "Invalid review status.");
  }
  return normalized;
}

function normalizeAccessPolicy(policy) {
  if (!policy) {
    return "standard";
  }

  const normalized = String(policy).toLowerCase();
  if (!ACCESS_POLICIES.includes(normalized)) {
    throw httpError(422, "Invalid access policy.");
  }
  return normalized;
}

function parseDate(value) {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw httpError(422, "Invalid access expiry date.");
  }
  return parsed;
}

function parseAllowedUserIds(value) {
  if (!value) {
    return [];
  }

  const raw = Array.isArray(value)
    ? value
    : (() => {
        try {
          const parsed = JSON.parse(value);
          return Array.isArray(parsed) ? parsed : [];
        } catch {
          return String(value)
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean);
        }
      })();

  const ids = [...new Set(raw.map((item) => String(item)).filter(Boolean))];
  if (ids.some((id) => !mongoose.isValidObjectId(id))) {
    throw httpError(422, "Allowed teachers contain an invalid user id.");
  }

  return ids;
}

async function validateAllowedTeachers(ids) {
  if (ids.length === 0) {
    return [];
  }

  const teachers = await User.find({ _id: { $in: ids }, role: "User" }).select("_id");
  if (teachers.length !== ids.length) {
    throw httpError(422, "Assigned access can only include valid teacher accounts.");
  }
  return ids;
}

function effectiveAccessPolicy(question) {
  return question.accessPolicy || (question.passwordHash ? "password" : "standard");
}

function isAccessExpired(question) {
  return Boolean(question.accessExpiresAt && question.accessExpiresAt <= new Date());
}

function isAssignedUser(user, question) {
  return (question.allowedUsers || []).some((allowedUser) => {
    const id = allowedUser?._id || allowedUser;
    return String(id) === user.id;
  });
}

function questionAccessToken(user, question) {
  return jwt.sign(
    {
      sub: user.id,
      qid: question.id
    },
    process.env.JWT_SECRET || "dev-secret",
    { expiresIn: "15m" }
  );
}

function hasQuestionAccess(req, question) {
  if (req.user.role !== "User") {
    return true;
  }

  if (isAccessExpired(question)) {
    return false;
  }

  const policy = effectiveAccessPolicy(question);

  if (policy === "standard") {
    return true;
  }

  if (policy === "assigned") {
    return isAssignedUser(req.user, question);
  }

  if (policy !== "password") {
    return true;
  }

  const token = req.query.accessToken || req.headers["x-question-access-token"];
  if (!token) {
    return false;
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || "dev-secret");
    return payload.sub === req.user.id && payload.qid === question.id;
  } catch {
    return false;
  }
}

function serializeQuestion(question, req) {
  const data = question.toJSON();
  const policy = effectiveAccessPolicy(question);
  const gated = req.user.role === "User" && policy === "password";
  const granted = hasQuestionAccess(req, question);

  if (data.questionFile) {
    delete data.questionFile.url;
  }

  data.accessRequired = gated && !granted;
  data.accessLabel =
    policy === "password" ? "Password protected" : policy === "assigned" ? "Assigned teachers only" : "Standard access";
  if (data.accessRequired) {
    delete data.questionFile;
  }

  return data;
}

function buildQuestionFilter(req) {
  const { query, user } = req;
  const filter = {};
  const wantsDeleted = query.deleted === "true";

  if (user.role === "User") {
    filter.deletedAt = null;
    filter.isActive = true;
    filter.reviewStatus = "selected";
    filter.$and = [
      {
        $or: [{ accessExpiresAt: null }, { accessExpiresAt: { $gt: new Date() } }]
      },
      {
        $or: [
          { accessPolicy: { $in: [null, "standard", "password"] } },
          { accessPolicy: { $exists: false } },
          { accessPolicy: "assigned", allowedUsers: user._id }
        ]
      }
    ];
  } else {
    filter.deletedAt = wantsDeleted ? { $ne: null } : null;
  }

  if (user.role === "SubAdmin") {
    filter.owner = user._id;
  }

  if (query.courseId && mongoose.isValidObjectId(query.courseId)) {
    filter.course = query.courseId;
  }

  if (user.role !== "User") {
    const reviewStatus = normalizeReviewStatus(query.reviewStatus || query.status);
    if (reviewStatus) {
      filter.reviewStatus = reviewStatus;
    }

    const active = parseBoolean(query.active);
    if (active !== undefined) {
      filter.isActive = active;
    }
  }

  if (query.search) {
    filter.title = new RegExp(String(query.search).trim(), "i");
  }

  return filter;
}

async function findQuestionForRequest(req) {
  const question = await Question.findById(req.params.id).populate("course owner allowedUsers");
  if (!question) {
    throw httpError(404, "Question not found.");
  }

  if (req.user.role === "User") {
    if (
      question.deletedAt ||
      !question.isActive ||
      question.reviewStatus !== "selected" ||
      isAccessExpired(question) ||
      (effectiveAccessPolicy(question) === "assigned" && !isAssignedUser(req.user, question))
    ) {
      throw httpError(404, "Question not found.");
    }
  }

  if (req.user.role === "SubAdmin" && String(question.owner._id) !== req.user.id) {
    throw httpError(403, "You can only access your own questions.");
  }

  return question;
}

export const listQuestions = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const filter = buildQuestionFilter(req);

  const [questions, total] = await Promise.all([
    Question.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("course owner allowedUsers"),
    Question.countDocuments(filter)
  ]);

  res.json({
    data: questions.map((question) => serializeQuestion(question, req)),
    meta: paginationMeta(total, page, limit)
  });
});

export const getQuestion = asyncHandler(async (req, res) => {
  const question = await findQuestionForRequest(req);
  res.json({ data: serializeQuestion(question, req) });
});

export const createQuestion = asyncHandler(async (req, res) => {
  const title = String(req.body.title || "").trim();
  const courseId = req.body.courseId || req.body.course_id;
  const questionFile = req.files?.question?.[0];
  const imageFile = req.files?.image?.[0];
  const accessPolicy = normalizeAccessPolicy(req.body.accessPolicy);
  const allowedUserIds = parseAllowedUserIds(req.body.allowedUserIds);
  const accessExpiresAt = parseDate(req.body.accessExpiresAt);
  const accessPassword = String(req.body.accessPassword || req.body.password || "");

  if (!title || !courseId || !questionFile || !imageFile) {
    await Promise.all([
      deleteStoredFile(fileDocument(questionFile, "question_files")),
      deleteStoredFile(fileDocument(imageFile, "question_images"))
    ]);
    throw httpError(422, "Title, course, question file, and image are required.");
  }

  const course = await Course.findOne({ _id: courseId, deletedAt: null, isActive: true });
  if (!course) {
    await Promise.all([
      deleteStoredFile(fileDocument(questionFile, "question_files")),
      deleteStoredFile(fileDocument(imageFile, "question_images"))
    ]);
    throw httpError(422, "Selected course is not available.");
  }

  if (accessPolicy === "password" && accessPassword.length < 4) {
    await Promise.all([
      deleteStoredFile(fileDocument(questionFile, "question_files")),
      deleteStoredFile(fileDocument(imageFile, "question_images"))
    ]);
    throw httpError(422, "A password protected policy requires at least 4 characters.");
  }

  if (accessPolicy === "assigned" && allowedUserIds.length === 0) {
    await Promise.all([
      deleteStoredFile(fileDocument(questionFile, "question_files")),
      deleteStoredFile(fileDocument(imageFile, "question_images"))
    ]);
    throw httpError(422, "Assigned teachers policy requires at least one teacher.");
  }
  const validatedAllowedUserIds = accessPolicy === "assigned" ? await validateAllowedTeachers(allowedUserIds) : [];

  const question = await Question.create({
    title,
    course: course._id,
    owner: req.user._id,
    questionFile: fileDocument(questionFile, "question_files"),
    imageFile: fileDocument(imageFile, "question_images"),
    isActive: parseBoolean(req.body.isActive) ?? true,
    accessPolicy,
    allowedUsers: validatedAllowedUserIds,
    accessExpiresAt,
    passwordHash: accessPolicy === "password" ? await bcrypt.hash(accessPassword, 12) : null
  });

  await question.populate("course owner allowedUsers");
  res.status(201).json({ data: serializeQuestion(question, req) });
});

export const updateQuestion = asyncHandler(async (req, res) => {
  const question = await Question.findById(req.params.id);
  if (!question || question.deletedAt) {
    throw httpError(404, "Question not found.");
  }
  assertQuestionManager(req, question);

  const title = String(req.body.title || "").trim();
  const courseId = req.body.courseId || req.body.course_id;

  if (!title || !courseId) {
    throw httpError(422, "Title and course are required.");
  }

  const course = await Course.findOne({ _id: courseId, deletedAt: null, isActive: true });
  if (!course) {
    throw httpError(422, "Selected course is not available.");
  }

  const nextQuestionFile = req.files?.question?.[0];
  const nextImageFile = req.files?.image?.[0];
  const nextAccessPolicy = normalizeAccessPolicy(req.body.accessPolicy || effectiveAccessPolicy(question));
  const nextAllowedUserIds = parseAllowedUserIds(req.body.allowedUserIds);
  const nextAccessExpiresAt = parseDate(req.body.accessExpiresAt);
  const nextAccessPassword = String(req.body.accessPassword || req.body.password || "");

  if (nextAccessPolicy === "password" && !question.passwordHash && nextAccessPassword.length < 4) {
    throw httpError(422, "A password protected policy requires a password.");
  }

  if (nextAccessPolicy === "assigned" && nextAllowedUserIds.length === 0) {
    throw httpError(422, "Assigned teachers policy requires at least one teacher.");
  }
  const validatedAllowedUserIds = nextAccessPolicy === "assigned" ? await validateAllowedTeachers(nextAllowedUserIds) : [];

  question.title = title;
  question.course = course._id;
  question.isActive = parseBoolean(req.body.isActive) ?? false;
  question.accessPolicy = nextAccessPolicy;
  question.accessExpiresAt = nextAccessExpiresAt;
  question.allowedUsers = validatedAllowedUserIds;

  if (nextAccessPolicy !== "password") {
    question.passwordHash = null;
  } else if (nextAccessPassword) {
    if (nextAccessPassword.length < 4) {
      throw httpError(422, "Password must be at least 4 characters.");
    }
    question.passwordHash = await bcrypt.hash(nextAccessPassword, 12);
  }

  if (nextQuestionFile) {
    await deleteStoredFile(question.questionFile);
    question.questionFile = fileDocument(nextQuestionFile, "question_files");
  }

  if (nextImageFile) {
    await deleteStoredFile(question.imageFile);
    question.imageFile = fileDocument(nextImageFile, "question_images");
  }

  await question.save();
  await question.populate("course owner allowedUsers");
  res.json({ data: serializeQuestion(question, req) });
});

export const updateQuestionAccessPolicy = asyncHandler(async (req, res) => {
  const question = await Question.findById(req.params.id).select("+passwordHash");
  if (!question || question.deletedAt) {
    throw httpError(404, "Question not found.");
  }
  assertQuestionManager(req, question);

  const accessPolicy = normalizeAccessPolicy(req.body.accessPolicy);
  const allowedUserIds = parseAllowedUserIds(req.body.allowedUserIds);
  const accessExpiresAt = parseDate(req.body.accessExpiresAt);
  const password = String(req.body.password || req.body.accessPassword || "");

  if (accessPolicy === "password" && !question.passwordHash && password.length < 4) {
    throw httpError(422, "A password protected policy requires a password.");
  }

  if (accessPolicy === "assigned" && allowedUserIds.length === 0) {
    throw httpError(422, "Assigned teachers policy requires at least one teacher.");
  }
  const validatedAllowedUserIds = accessPolicy === "assigned" ? await validateAllowedTeachers(allowedUserIds) : [];

  question.accessPolicy = accessPolicy;
  question.accessExpiresAt = accessExpiresAt;
  question.allowedUsers = validatedAllowedUserIds;

  if (accessPolicy === "password") {
    if (password) {
      if (password.length < 4) {
        throw httpError(422, "Password must be at least 4 characters.");
      }
      question.passwordHash = await bcrypt.hash(password, 12);
    }
  } else {
    question.passwordHash = null;
  }

  await question.save();
  await question.populate("course owner allowedUsers");
  res.json({ data: serializeQuestion(question, req), message: "Access policy updated successfully." });
});

export const softDeleteQuestion = asyncHandler(async (req, res) => {
  const question = await Question.findById(req.params.id);
  if (!question || question.deletedAt) {
    throw httpError(404, "Question not found.");
  }
  assertQuestionManager(req, question);

  question.deletedAt = new Date();
  await question.save();
  res.json({ message: "Question moved to trash." });
});

export const restoreQuestion = asyncHandler(async (req, res) => {
  const question = await Question.findById(req.params.id);
  if (!question) {
    throw httpError(404, "Question not found.");
  }
  assertQuestionManager(req, question);

  question.deletedAt = null;
  await question.save();
  await question.populate("course owner allowedUsers");
  res.json({ data: serializeQuestion(question, req), message: "Question restored successfully." });
});

export const reviewQuestion = asyncHandler(async (req, res) => {
  const question = await Question.findById(req.params.id);
  if (!question || question.deletedAt) {
    throw httpError(404, "Question not found.");
  }

  const reviewStatus = normalizeReviewStatus(req.body.reviewStatus || req.params.status);
  question.reviewStatus = reviewStatus;
  await question.save();
  await question.populate("course owner");

  res.json({ data: serializeQuestion(question, req), message: `Question marked as ${reviewStatus}.` });
});

export const setQuestionPassword = asyncHandler(async (req, res) => {
  const question = await Question.findById(req.params.id || req.body.id);
  if (!question || question.deletedAt) {
    throw httpError(404, "Question not found.");
  }
  assertQuestionManager(req, question);

  const password = String(req.body.password || "");
  if (password.length < 4) {
    throw httpError(422, "Password must be at least 4 characters.");
  }

  question.passwordHash = await bcrypt.hash(password, 12);
  question.accessPolicy = "password";
  question.allowedUsers = [];
  await question.save();
  res.json({ message: "Password protected access policy enabled." });
});

export const clearQuestionPassword = asyncHandler(async (req, res) => {
  const question = await Question.findById(req.params.id);
  if (!question || question.deletedAt) {
    throw httpError(404, "Question not found.");
  }
  assertQuestionManager(req, question);

  question.passwordHash = null;
  question.accessPolicy = "standard";
  question.allowedUsers = [];
  await question.save();
  res.json({ message: "Standard access policy enabled." });
});

export const checkQuestionPassword = asyncHandler(async (req, res) => {
  const question = await Question.findById(req.params.id || req.body.id).select("+passwordHash").populate("allowedUsers");
  if (
    !question ||
    question.deletedAt ||
    !question.isActive ||
    question.reviewStatus !== "selected" ||
    isAccessExpired(question) ||
    (effectiveAccessPolicy(question) === "assigned" && !isAssignedUser(req.user, question))
  ) {
    throw httpError(404, "Question not found.");
  }

  if (effectiveAccessPolicy(question) !== "password" || !question.passwordHash) {
    res.json({
      status: "success",
      message: "Question does not require password unlock.",
      accessToken: questionAccessToken(req.user, question)
    });
    return;
  }

  const matches = await bcrypt.compare(String(req.body.password || ""), question.passwordHash);
  if (!matches) {
    throw httpError(401, "Password not matched.");
  }

  res.json({
    status: "success",
    message: "Password matched successfully.",
    accessToken: questionAccessToken(req.user, question)
  });
});

export const downloadQuestionFile = asyncHandler(async (req, res) => {
  const question = await findQuestionForRequest(req);
  if (!hasQuestionAccess(req, question)) {
    throw httpError(403, "Password access is required for this file.");
  }

  res.download(uploadPath(question.questionFile.path), question.questionFile.originalName);
});
