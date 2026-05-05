import "dotenv/config";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { connectDb } from "./config/db.js";
import { errorHandler, notFound } from "./middleware/error.js";
import authRoutes from "./routes/authRoutes.js";
import courseRoutes from "./routes/courseRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import questionRoutes from "./routes/questionRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import { uploadPath } from "./utils/uploads.js";

const app = express();
const port = Number(process.env.PORT || 5000);
const clientOrigins = (process.env.CLIENT_URL || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
  })
);
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || clientOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(null, true);
    },
    credentials: true
  })
);
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

app.use("/uploads/question_images", express.static(uploadPath("question_images")));
app.use("/uploads/profile_pics", express.static(uploadPath("profile_pics")));
app.get("/api/health", (_req, res) => res.json({ ok: true, service: "campus-question-vault-api" }));
app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/users", userRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/questions", questionRoutes);
app.use(notFound);
app.use(errorHandler);

connectDb()
  .then(() => {
    app.listen(port, () => {
      console.log(`Campus Question Vault API running on http://localhost:${port}`);
    });
  })
  .catch((error) => {
    console.error("MongoDB connection failed", error);
    process.exit(1);
  });
