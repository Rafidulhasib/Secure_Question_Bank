import { Router } from "express";
import {
  checkQuestionPassword,
  clearQuestionPassword,
  createQuestion,
  getQuestion,
  downloadQuestionFile,
  listQuestions,
  restoreQuestion,
  reviewQuestion,
  setQuestionPassword,
  softDeleteQuestion,
  updateQuestionAccessPolicy,
  updateQuestion
} from "../controllers/questionController.js";
import { authenticate, requireRole } from "../middleware/auth.js";
import { questionUpload } from "../middleware/upload.js";

const router = Router();

router.use(authenticate);

router.get("/", listQuestions);
router.get("/:id/file", downloadQuestionFile);
router.get("/:id", getQuestion);
router.post("/:id/password/check", checkQuestionPassword);

router.post("/", requireRole("SubAdmin", "SuperAdmin"), questionUpload, createQuestion);
router.put("/:id", requireRole("SubAdmin", "SuperAdmin"), questionUpload, updateQuestion);
router.delete("/:id", requireRole("SubAdmin", "SuperAdmin"), softDeleteQuestion);
router.patch("/:id/restore", requireRole("SubAdmin", "SuperAdmin"), restoreQuestion);
router.put("/:id/access-policy", requireRole("SubAdmin", "SuperAdmin"), updateQuestionAccessPolicy);
router.put("/:id/password", requireRole("SubAdmin", "SuperAdmin"), setQuestionPassword);
router.delete("/:id/password", requireRole("SubAdmin", "SuperAdmin"), clearQuestionPassword);

router.patch("/:id/review/:status", requireRole("SuperAdmin"), reviewQuestion);
router.patch("/:id/select", requireRole("SuperAdmin"), (req, _res, next) => {
  req.params.status = "selected";
  next();
}, reviewQuestion);
router.patch("/:id/reject", requireRole("SuperAdmin"), (req, _res, next) => {
  req.params.status = "rejected";
  next();
}, reviewQuestion);
router.patch("/:id/clear", requireRole("SuperAdmin"), (req, _res, next) => {
  req.params.status = "pending";
  next();
}, reviewQuestion);

export default router;
