import { useState, useRef, useCallback } from "react";
import {
  X,
  Upload,
  FileText,
  Image,
  Trash2,
  Loader2,
  CheckCircle,
  AlertCircle,
  CloudUpload,
  File,
  Download,
} from "lucide-react";
import { uploadDocument, deleteDocument } from "../services/employeeService";

// ─── Helpers ─────────────────────────────────────────────────────────────────
const formatBytes = (bytes = 0) => {
  if (bytes === 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const getFileIcon = (mimetype = "") => {
  if (mimetype === "application/pdf")
    return <FileText size={20} className="text-red-500" />;
  if (mimetype.startsWith("image/"))
    return <Image size={20} className="text-blue-500" />;
  return <File size={20} className="text-gray-400" />;
};

const ACCEPTED_TYPES = ["application/pdf", "image/jpeg", "image/png"];
const MAX_SIZE_MB = 5;

// ─── Component ───────────────────────────────────────────────────────────────
/**
 * DocumentModal
 * Props:
 *   isOpen      boolean
 *   onClose     fn
 *   employee    { _id, firstName, lastName, documents: [] }
 *   onUpdate    fn(updatedEmployee) — called after any upload / delete
 */
const DocumentModal = ({ isOpen, onClose, employee, onUpdate }) => {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadError, setUploadError] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const fileInputRef = useRef(null);

  // ── Validate file before uploading ────────────────────────────────────────
  const validateFile = (file) => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return "Invalid file type. Only PDF, JPG, and PNG are accepted.";
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      return `File too large. Maximum size is ${MAX_SIZE_MB} MB.`;
    }
    return null;
  };


  // ── Upload handler ─────────────────────────────────────────────────────────
 const handleUpload = useCallback(async (file) => {
    setUploadError("");
    setUploadSuccess("");

    const validationError = validateFile(file);
    if (validationError) {
      setUploadError(validationError);
      return;
    }

    setUploading(true);
    setProgress(0);
    try {
      const result = await uploadDocument(employee?._id, file, setProgress);
      setUploadSuccess(`"${file.name}" uploaded successfully.`);
      if (onUpdate) onUpdate(result.data, "upload");
      setTimeout(() => setUploadSuccess(""), 3500);
    } catch (err) {
      setUploadError(
        err.response?.data?.message || "Upload failed. Please try again."
      );
    } finally {
      setUploading(false);
      setProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }, [employee?._id, onUpdate]);

  // ── Drag & drop ────────────────────────────────────────────────────────────
const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleUpload(file);
    },
    [handleUpload]
  );

 if (!isOpen || !employee) return null;

  // Rest of the component (docs, handleDelete, etc.)
  const docs = employee.documents || [];

  const handleDelete = async (docId) => {
    setDeletingId(docId);
    try {
      const result = await deleteDocument(employee._id, docId);
      if (onUpdate) onUpdate(result.data, "delete");
    } catch (err) {
      setUploadError(
        err.response?.data?.message || "Failed to delete document."
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl flex flex-col overflow-hidden max-h-[90vh]">
        {/* ── Header ────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Documents</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {employee.firstName} {employee.lastName} ·{" "}
              <span className="font-semibold text-indigo-600">
                {docs.length} file{docs.length !== 1 ? "s" : ""}
              </span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* ── Scrollable body ────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5">
          {/* Upload zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => !uploading && fileInputRef.current?.click()}
            className={`relative border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all ${
              dragging
                ? "border-indigo-500 bg-indigo-50 scale-[1.01]"
                : "border-gray-200 bg-gray-50 hover:border-indigo-400 hover:bg-indigo-50/40"
            } ${uploading ? "pointer-events-none opacity-70" : ""}`}
          >
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files[0];
                if (file) handleUpload(file);
              }}
            />

            {uploading ? (
              <>
                <Loader2 size={32} className="text-indigo-500 animate-spin" />
                <p className="text-sm font-semibold text-indigo-600">Uploading…</p>
                {/* Progress bar */}
                <div className="w-full max-w-xs bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500">{progress}%</p>
              </>
            ) : (
              <>
                <div className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center">
                  <CloudUpload size={26} className="text-indigo-500" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-gray-700">
                    Drag & drop a file here, or{" "}
                    <span className="text-indigo-600 underline underline-offset-2">
                      click to browse
                    </span>
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    PDF, JPG, PNG · Max {MAX_SIZE_MB} MB per file
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Feedback messages */}
          {uploadError && (
            <div className="flex items-start gap-2.5 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
              <span>{uploadError}</span>
              <button
                onClick={() => setUploadError("")}
                className="ml-auto flex-shrink-0"
              >
                <X size={14} />
              </button>
            </div>
          )}
          {uploadSuccess && (
            <div className="flex items-center gap-2.5 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-700">
              <CheckCircle size={16} className="flex-shrink-0" />
              {uploadSuccess}
            </div>
          )}

          {/* Document list */}
          {docs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center text-gray-400">
              <Upload size={28} className="mb-2 opacity-40" />
              <p className="text-sm">No documents yet. Upload your first file above.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                Uploaded Files
              </p>
              {docs.map((doc) => (
                <div
                  key={doc._id}
                  className="flex items-center gap-3 px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl hover:border-indigo-200 hover:bg-indigo-50/20 transition group"
                >
                  {/* Icon */}
                  <div className="w-9 h-9 bg-white border border-gray-200 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                    {getFileIcon(doc.mimetype)}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">
                      {doc.name}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {formatBytes(doc.size)} · {formatDate(doc.createdAt)}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                    {/* Download with correct filename */}
                    <button
                      onClick={async () => {
                        try {
                          const res = await fetch(`http://localhost:5000/${doc.path}`);
                          const blob = await res.blob();
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement("a");
                          a.href = url;
                          a.download = doc.name;
                          document.body.appendChild(a);
                          a.click();
                          a.remove();
                          URL.revokeObjectURL(url);
                        } catch {
                          window.open(`http://localhost:5000/${doc.path}`, "_blank");
                        }
                      }}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-100 transition"
                      title={`Download ${doc.name}`}
                    >
                      <Download size={15} />
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => handleDelete(doc._id)}
                      disabled={deletingId === doc._id}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-100 transition disabled:opacity-50"
                      title="Delete document"
                    >
                      {deletingId === doc._id ? (
                        <Loader2 size={15} className="animate-spin" />
                      ) : (
                        <Trash2 size={15} />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Footer ────────────────────────────────────────────────────── */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-medium text-gray-600 rounded-lg border border-gray-200 hover:bg-gray-100 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default DocumentModal;
