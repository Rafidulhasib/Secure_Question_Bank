import { Router } from "express";
import {
  createCourse,
  deleteCourse,
  forceDeleteCourse,
  listCourses,
  restoreCourse,
  updateCourse
} from "../controllers/courseController.js";
import { authenticate, requireRole } from "../middleware/auth.js";

const router = Router();

router.use(authenticate);
router.get("/", listCourses);

router.use(requireRole("SuperAdmin"));
router.post("/", createCourse);
router.put("/:id", updateCourse);
router.delete("/:id", deleteCourse);
router.patch("/:id/restore", restoreCourse);
router.delete("/:id/force", forceDeleteCourse);

export default router;
