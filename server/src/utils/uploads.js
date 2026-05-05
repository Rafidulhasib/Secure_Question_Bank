import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const uploadRoot = path.resolve(__dirname, "../../uploads");

export function uploadPath(...parts) {
  return path.join(uploadRoot, ...parts);
}

export function fileDocument(file, folder) {
  if (!file) {
    return null;
  }

  return {
    filename: file.filename,
    originalName: file.originalname,
    mimeType: file.mimetype,
    size: file.size,
    path: `${folder}/${file.filename}`,
    url: `/uploads/${folder}/${file.filename}`
  };
}

export async function deleteStoredFile(fileDoc) {
  if (!fileDoc?.path) {
    return;
  }

  try {
    await fs.unlink(path.join(uploadRoot, fileDoc.path));
  } catch (error) {
    if (error.code !== "ENOENT") {
      throw error;
    }
  }
}
