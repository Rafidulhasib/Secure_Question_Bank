import fs from "node:fs";
import path from "node:path";
import multer from "multer";
import { httpError } from "../utils/httpError.js";
import { uploadPath } from "../utils/uploads.js";

const folders = {
  question: "question_files",
  image: "question_images",
  profilePic: "profile_pics"
};

for (const folder of Object.values(folders)) {
  fs.mkdirSync(uploadPath(folder), { recursive: true });
}

const allowedMimeTypes = {
  question: [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ],
  image: ["image/png", "image/jpeg", "image/jpg"],
  profilePic: ["image/png", "image/jpeg", "image/jpg", "image/gif", "image/svg+xml"]
};

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, uploadPath(folders[file.fieldname] || "questions"));
  },
  filename(req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeBase = path
      .basename(file.originalname, ext)
      .replace(/[^a-z0-9]+/gi, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 40);
    cb(null, `${new Date().toISOString().slice(0, 10)}-${Date.now()}-${safeBase}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024
  },
  fileFilter(req, file, cb) {
    const allowed = allowedMimeTypes[file.fieldname];
    if (!allowed || !allowed.includes(file.mimetype)) {
      cb(httpError(422, `Unsupported file type for ${file.fieldname}.`));
      return;
    }
    cb(null, true);
  }
});

export const questionUpload = upload.fields([
  { name: "question", maxCount: 1 },
  { name: "image", maxCount: 1 }
]);

export const profileUpload = upload.single("profilePic");
