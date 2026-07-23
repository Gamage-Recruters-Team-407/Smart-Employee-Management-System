import multer from "multer";
import path from "path";
import fs from "fs";

// Ensure uploads/ directory exists
const UPLOAD_DIR = path.join(process.cwd(), "uploads");
const canUseDiskUploads = process.env.VERCEL !== "1";

if (canUseDiskUploads && !fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Disk storage — unique timestamped filename to prevent collisions
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

// Accept PDF, JPG, and PNG (for documents)
const fileFilter = (_req, file, cb) => {
  const allowedMimeTypes = ["application/pdf", "image/jpeg", "image/png"];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error("Invalid file type. Only PDF, JPG, and PNG files are accepted."),
      false
    );
  }
};

// Accept images only — JPG and PNG (for profile photos)
const imageFilter = (_req, file, cb) => {
  const allowedMimeTypes = ["image/jpeg", "image/png"];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error("Invalid file type. Only JPG and PNG images are accepted for profile photos."),
      false
    );
  }
};

// For documents (PDF / JPG / PNG, max 5 MB)
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

// For profile photos (JPG / PNG only, max 2 MB)
export const imageUpload = multer({
  storage,
  fileFilter: imageFilter,
  limits: { fileSize: 2 * 1024 * 1024 },
});

// ── Memory storage for documents that go straight to Cloudinary ──
const memoryStorage = multer.memoryStorage();

export const documentUpload = multer({
  storage: memoryStorage,
  fileFilter,                              // reuse PDF/JPG/PNG filter
  limits: { fileSize: 5 * 1024 * 1024 },   // 5MB
});

export default upload;
