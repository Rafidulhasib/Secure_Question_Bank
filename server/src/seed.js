import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import bcrypt from "bcryptjs";
import { connectDb } from "./config/db.js";
import Course from "./models/Course.js";
import Question from "./models/Question.js";
import User from "./models/User.js";
import { uploadPath } from "./utils/uploads.js";

const users = [
  {
    name: "Office of Examinations",
    email: "superadmin@gmail.com",
    password: "superadmin",
    role: "SuperAdmin"
  },
  {
    name: "Dr. Farhan Campus Admin",
    email: "subadmin@gmail.com",
    password: "subadmin",
    role: "SubAdmin"
  },
  {
    name: "Ms. Ayesha Rahman",
    email: "user@gmail.com",
    password: "user12345",
    role: "User"
  },
  {
    name: "Dr. Nusrat Karim",
    email: "teacher2@gmail.com",
    password: "teacher123",
    role: "User"
  }
];

const courses = [
  ["CSE101", "Introduction to Computer Science"],
  ["CSE201", "Data Structures"],
  ["CSE301", "Database Management Systems"],
  ["CSE401", "Software Engineering"],
  ["MAT101", "Calculus I"],
  ["PHY101", "Physics I"],
  ["ENG101", "Academic English"],
  ["EEE201", "Digital Logic Design"],
  ["STA201", "Statistics"],
  ["BUS101", "Business Fundamentals"]
];

const demoQuestions = [
  {
    title: "CSE201 Final Exam Set A",
    code: "CSE201",
    status: "selected",
    active: true,
    accessPolicy: "password",
    color: "#0f766e",
    summary: "Approved final exam package for Data Structures."
  },
  {
    title: "PHY101 Midterm Confidential Packet",
    code: "PHY101",
    status: "selected",
    active: true,
    accessPolicy: "standard",
    color: "#2563eb",
    summary: "Midterm question distribution set for Physics I."
  },
  {
    title: "MAT101 Retake Question Set",
    code: "MAT101",
    status: "pending",
    active: true,
    accessPolicy: "password",
    color: "#b45309",
    summary: "Retake assessment packet waiting for review."
  },
  {
    title: "ENG101 Board Examination Draft",
    code: "ENG101",
    status: "rejected",
    active: true,
    accessPolicy: "standard",
    color: "#be123c",
    summary: "Draft returned for revision before distribution."
  },
  {
    title: "CSE301 Database Systems Final Set",
    code: "CSE301",
    status: "selected",
    active: true,
    accessPolicy: "assigned",
    color: "#15803d",
    summary: "Approved secure package for Database Management Systems."
  },
  {
    title: "STA201 Statistics Quiz Packet",
    code: "STA201",
    status: "pending",
    active: false,
    accessPolicy: "standard",
    color: "#6d28d9",
    summary: "Inactive quiz packet prepared for moderation."
  }
];

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function reviewStatusLabel(status) {
  const labels = {
    selected: "Approved",
    pending: "Pending Review",
    rejected: "Needs Revision"
  };
  return labels[status] || status;
}

async function ensureDemoFiles(item, course) {
  await fs.mkdir(uploadPath("question_files"), { recursive: true });
  await fs.mkdir(uploadPath("question_images"), { recursive: true });

  const slug = slugify(item.title);
  const pdfName = `${slug}.pdf`;
  const imageName = `${slug}.svg`;
  const pdfPath = uploadPath("question_files", pdfName);
  const imagePath = uploadPath("question_images", imageName);
  const pdfContent = [
    "Campus Question Vault Demo File",
    `Title: ${item.title}`,
    `Subject: ${course.code} - ${course.title}`,
    `Review status: ${item.status}`,
    `Access: ${item.accessPolicy}`,
    "",
    item.summary
  ].join("\\n");
  const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="620" viewBox="0 0 960 620">
  <rect width="960" height="620" rx="36" fill="#f8fafc"/>
  <rect x="46" y="46" width="868" height="528" rx="28" fill="#ffffff" stroke="#d9e0ea" stroke-width="4"/>
  <rect x="82" y="82" width="180" height="56" rx="16" fill="${item.color}"/>
  <text x="106" y="119" font-family="Arial, sans-serif" font-size="26" font-weight="700" fill="#ffffff">${escapeXml(course.code)}</text>
  <text x="82" y="210" font-family="Arial, sans-serif" font-size="42" font-weight="700" fill="#172033">${escapeXml(item.title)}</text>
  <text x="82" y="270" font-family="Arial, sans-serif" font-size="24" fill="#667085">${escapeXml(course.title)}</text>
  <text x="82" y="356" font-family="Arial, sans-serif" font-size="24" fill="#334155">${escapeXml(item.summary)}</text>
  <rect x="82" y="430" width="240" height="48" rx="24" fill="#eef2f6"/>
  <text x="110" y="462" font-family="Arial, sans-serif" font-size="22" font-weight="700" fill="#334155">${escapeXml(reviewStatusLabel(item.status))}</text>
  <rect x="344" y="430" width="310" height="48" rx="24" fill="${item.accessPolicy === "standard" ? "#dcfce7" : "#ffe4e6"}"/>
  <text x="372" y="462" font-family="Arial, sans-serif" font-size="22" font-weight="700" fill="${item.accessPolicy === "standard" ? "#166534" : "#9f1239"}">${escapeXml(item.accessPolicy === "password" ? "Password Protected" : item.accessPolicy === "assigned" ? "Assigned Teachers" : "Standard Access")}</text>
</svg>`;

  await fs.writeFile(pdfPath, pdfContent);
  await fs.writeFile(imagePath, svgContent);

  return {
    questionFile: {
      filename: pdfName,
      originalName: `${item.title}.pdf`,
      mimeType: "application/pdf",
      size: Buffer.byteLength(pdfContent),
      path: `question_files/${pdfName}`,
      url: `/uploads/question_files/${pdfName}`
    },
    imageFile: {
      filename: imageName,
      originalName: `${item.title} preview.svg`,
      mimeType: "image/svg+xml",
      size: Buffer.byteLength(svgContent),
      path: `question_images/${imageName}`,
      url: `/uploads/question_images/${imageName}`
    }
  };
}

export async function seedDemoData() {
  const seededUsers = new Map();
  for (const item of users) {
    const user = await User.findOneAndUpdate(
      { email: item.email },
      {
        name: item.name,
        email: item.email,
        role: item.role,
        emailVerifiedAt: new Date(),
        passwordHash: await bcrypt.hash(item.password, 12)
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    seededUsers.set(item.email, user);
  }

  const seededCourses = new Map();
  for (const [code, title] of courses) {
    const course = await Course.findOneAndUpdate(
      { code },
      { code, title, isActive: true, deletedAt: null },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    seededCourses.set(code, course);
  }

  const owner = seededUsers.get("subadmin@gmail.com") || seededUsers.get("superadmin@gmail.com");
  const assignedTeacher = seededUsers.get("user@gmail.com");
  for (const item of demoQuestions) {
    const course = seededCourses.get(item.code);
    if (!course || !owner) {
      continue;
    }

    const files = await ensureDemoFiles(item, course);
    await Question.findOneAndUpdate(
      { title: item.title },
      {
        title: item.title,
        course: course._id,
        owner: owner._id,
        questionFile: files.questionFile,
        imageFile: files.imageFile,
        isActive: item.active,
        reviewStatus: item.status,
        accessPolicy: item.accessPolicy,
        allowedUsers: item.accessPolicy === "assigned" && assignedTeacher ? [assignedTeacher._id] : [],
        accessExpiresAt: null,
        passwordHash: item.accessPolicy === "password" ? await bcrypt.hash("exam1234", 12) : null,
        deletedAt: null
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }

  console.log("Seed complete.");
}

async function runSeedCli() {
  try {
    await connectDb();
    await seedDemoData();
    process.exit(0);
  } catch (error) {
    console.error(`Seed failed: ${error.message}`);
    console.error("Check that MongoDB is running and MONGO_URI is correct.");
    process.exit(1);
  }
}

const currentFile = fileURLToPath(import.meta.url);
const entryFile = process.argv[1] ? path.resolve(process.argv[1]) : "";

if (entryFile === currentFile) {
  runSeedCli();
}
