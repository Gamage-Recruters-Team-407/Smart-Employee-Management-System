import express from "express";
import upload from "../config/multer.js";
import { uploadDocument, deleteDocument } from "../controllers/documentController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router({ mergeParams: true }); // inherit :id from parent router

// Apply protect middleware to all document routes
router.use(protect);

/**
 * POST /api/employees/:id/documents
 * Upload a document for an employee.
 * Field name in the multipart form must be "document".
 *
 * Multer errors (file-size / file-type) are caught here and returned
 * as a 400 JSON response so the frontend receives a clean error message.
 */
router.post("/", (req, res, next) => {
  const multerMiddleware = upload.single("document");
  multerMiddleware(req, res, (err) => {
    if (err) {
      // Multer validation error (size / type)
      return res.status(400).json({ success: false, message: err.message });
    }
    next();
  });
}, uploadDocument);

/**
 * DELETE /api/employees/:id/documents/:docId
 * Remove a specific document from an employee's documents array and from disk.
 */
router.delete("/:docId", deleteDocument);

export default router;
