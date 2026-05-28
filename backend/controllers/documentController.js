import fs from "fs";
import path from "path";
import Employee from "../models/Employee.js";

/**
 * POST /api/employees/:id/documents
 * Upload a file (PDF / JPG / PNG, max 5 MB) and attach it to the employee's documents array.
 * Multer handles file validation and disk storage before this controller runs.
 * Returns the updated employee document.
 */
export const uploadDocument = async (req, res) => {
  try {
    // Multer stores the validated file on req.file
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded. Please attach a PDF, JPG, or PNG file.",
      });
    }

    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      // Remove the already-saved file from disk to avoid orphans
      fs.unlink(req.file.path, () => {});
      return res.status(404).json({ success: false, message: "Employee not found." });
    }

    // Push the document metadata into the employee's documents array
    employee.documents.push({
      name: req.file.originalname,
      path: req.file.path.replace(/\\/g, "/"), // normalise Windows path separators
      mimetype: req.file.mimetype,
      size: req.file.size,
    });

    await employee.save();

    return res.status(201).json({
      success: true,
      message: "Document uploaded successfully.",
      data: employee,
    });
  } catch (error) {
    console.error("uploadDocument error:", error);
    if (error.name === "CastError") {
      return res.status(400).json({ success: false, message: "Invalid employee ID format." });
    }
    return res.status(500).json({
      success: false,
      message: "Server error while uploading document.",
      error: error.message,
    });
  }
};

/**
 * DELETE /api/employees/:id/documents/:docId
 * Remove a single document entry from the employee's documents array
 * and delete the physical file from disk.
 * Returns the updated employee document.
 */
export const deleteDocument = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ success: false, message: "Employee not found." });
    }

    // Find the sub-document by its _id
    const doc = employee.documents.id(req.params.docId);
    if (!doc) {
      return res.status(404).json({ success: false, message: "Document not found." });
    }

    // Delete the physical file from disk (best-effort — don't fail if file is missing)
    const absolutePath = path.resolve(doc.path);
    fs.unlink(absolutePath, (err) => {
      if (err && err.code !== "ENOENT") {
        console.warn("Could not delete file from disk:", err.message);
      }
    });

    // Remove the sub-document from the array using Mongoose's pull
    employee.documents.pull({ _id: req.params.docId });
    await employee.save();

    return res.status(200).json({
      success: true,
      message: "Document deleted successfully.",
      data: employee,
    });
  } catch (error) {
    console.error("deleteDocument error:", error);
    if (error.name === "CastError") {
      return res.status(400).json({ success: false, message: "Invalid ID format." });
    }
    return res.status(500).json({
      success: false,
      message: "Server error while deleting document.",
      error: error.message,
    });
  }
};
