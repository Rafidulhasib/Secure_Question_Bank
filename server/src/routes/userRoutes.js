import { Router } from "express";
import {
  createUser,
  deleteUser,
  listUsers,
  updateMe,
  updateUser
} from "../controllers/userController.js";
import { authenticate, requireRole } from "../middleware/auth.js";
import { profileUpload } from "../middleware/upload.js";

const router = Router();

router.use(authenticate);

router.patch("/me", profileUpload, updateMe);

router.use(requireRole("SuperAdmin"));
router.get("/", listUsers);
router.post("/", createUser);
router.put("/:id", profileUpload, updateUser);
router.delete("/:id", deleteUser);

export default router;
