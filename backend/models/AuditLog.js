import mongoose from "mongoose";

/**
 * AuditLog — records every create, update, delete, and file operation
 * performed on an employee. Displayed as a timeline on the profile page.
 */
const auditLogSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Employee",
    required: true,
    index: true,
  },
  action: {
    type: String,
    enum: [
      "created",
      "updated",
      "deleted",
      "photo_uploaded",
      "document_uploaded",
      "document_deleted",
    ],
    required: true,
  },
  performedBy: {
    type: String,
    default: "Admin User",
  },
  changes: [
    {
      field: { type: String },
      oldValue: { type: mongoose.Schema.Types.Mixed },
      newValue: { type: mongoose.Schema.Types.Mixed },
    },
  ],
  summary: { type: String },
  timestamp: { type: Date, default: Date.now },
});

auditLogSchema.index({ employeeId: 1, timestamp: -1 });

export default mongoose.model("AuditLog", auditLogSchema);
