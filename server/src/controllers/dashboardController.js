import Course from "../models/Course.js";
import Question from "../models/Question.js";
import User from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const dashboard = asyncHandler(async (req, res) => {
  if (req.user.role === "SuperAdmin") {
    const [
      courses,
      questions,
      users,
      subAdmins,
      pendingQuestions,
      selectedQuestions,
      rejectedQuestions
    ] = await Promise.all([
      Course.countDocuments({ deletedAt: null }),
      Question.countDocuments({ deletedAt: null }),
      User.countDocuments({ role: "User" }),
      User.countDocuments({ role: "SubAdmin" }),
      Question.countDocuments({ deletedAt: null, reviewStatus: "pending" }),
      Question.countDocuments({ deletedAt: null, reviewStatus: "selected" }),
      Question.countDocuments({ deletedAt: null, reviewStatus: "rejected" })
    ]);

    res.json({
      data: {
        courses,
        questions,
        users,
        subAdmins,
        pendingQuestions,
        selectedQuestions,
        rejectedQuestions
      }
    });
    return;
  }

  if (req.user.role === "SubAdmin") {
    const [courses, questions, activeQuestions, inactiveQuestions, selectedQuestions, rejectedQuestions] =
      await Promise.all([
        Course.countDocuments({ deletedAt: null, isActive: true }),
        Question.countDocuments({ owner: req.user._id, deletedAt: null }),
        Question.countDocuments({ owner: req.user._id, deletedAt: null, isActive: true }),
        Question.countDocuments({ owner: req.user._id, deletedAt: null, isActive: false }),
        Question.countDocuments({ owner: req.user._id, deletedAt: null, reviewStatus: "selected" }),
        Question.countDocuments({ owner: req.user._id, deletedAt: null, reviewStatus: "rejected" })
      ]);

    res.json({
      data: {
        courses,
        questions,
        activeQuestions,
        inactiveQuestions,
        selectedQuestions,
        rejectedQuestions
      }
    });
    return;
  }

  const [publishedQuestions, courses] = await Promise.all([
    Question.countDocuments({ deletedAt: null, isActive: true, reviewStatus: "selected" }),
    Course.countDocuments({ deletedAt: null, isActive: true })
  ]);

  res.json({
    data: {
      publishedQuestions,
      courses
    }
  });
});
