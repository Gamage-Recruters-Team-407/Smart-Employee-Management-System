import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Pencil, Mail, Phone, Building2, Briefcase,
  DollarSign, Calendar, MapPin, UserCheck, UserX,
  FileText, Image, File, Download, Loader2, AlertCircle,
  Paperclip,
} from "lucide-react";
import { fetchEmployeeById } from "../services/employeeService";
import AddEmployeeModal from "../components/AddEmployeeModal";
import DocumentModal from "../components/DocumentModal";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const BASE_URL = import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:5000";

const STATUS_STYLES = {
  Active:     "bg-emerald-100 text-emerald-700 border border-emerald-200",
  Inactive:   "bg-gray-100 text-gray-600 border border-gray-200",
  "On Leave": "bg-amber-100 text-amber-700 border border-amber-200",
  Terminated: "bg-red-100 text-red-700 border border-red-200",
};

const AVATAR_COLORS = [
  "bg-indigo-500","bg-violet-500","bg-pink-500","bg-rose-500",
  "bg-orange-500","bg-teal-500","bg-cyan-500","bg-sky-500",
];

const formatDate = (d) => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
};

const formatSalary = (s) => {
  if (!s && s !== 0) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(s);
};

const getFileIcon = (mimetype = "") => {
  if (mimetype === "application/pdf") return <FileText size={18} className="text-red-500" />;
  if (mimetype.startsWith("image/"))   return <Image size={18} className="text-blue-500" />;
  return <File size={18} className="text-gray-400" />;
};

const formatBytes = (bytes = 0) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// ─── InfoRow ─────────────────────────────────────────────────────────────────
const InfoRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-3">
    <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
      <Icon size={15} className="text-gray-400" />
    </div>
    <div>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</p>
      <p className="text-sm font-medium text-gray-800 mt-0.5">{value || "—"}</p>
    </div>
  </div>
);

// ─── Section Card ─────────────────────────────────────────────────────────────
const SectionCard = ({ title, children }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
    <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-5">{title}</p>
    {children}
  </div>
);

// ─── Main Page ────────────────────────────────────────────────────────────────
const EmployeeProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [employee, setEmployee] = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");
  const [showEdit, setShowEdit] = useState(false);
  const [showDocs, setShowDocs] = useState(false);
  const [toast, setToast]       = useState("");

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 3500); };

  const load = async () => {
    setLoading(true); setError("");
    try {
      const res = await fetchEmployeeById(id);
      setEmployee(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load employee.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const handleSaved = async () => {
    setShowEdit(false);
    await load();
    showToast("Employee updated successfully.");
  };

  const handleDocUpdate = (updated, action) => {
    setEmployee(updated);
    if (action === "upload") showToast("Document uploaded.");
    if (action === "delete") showToast("Document deleted.");
  };

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 gap-3 text-gray-400">
        <Loader2 size={24} className="animate-spin text-indigo-500" />
        <span className="text-sm">Loading profile…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4 text-center">
        <AlertCircle size={36} className="text-red-400" />
        <p className="text-gray-700 font-semibold">{error}</p>
        <button onClick={() => navigate("/employees")} className="text-sm text-indigo-600 hover:underline">
          ← Back to Employees
        </button>
      </div>
    );
  }

  if (!employee) return null;

  const fullName   = `${employee.firstName} ${employee.lastName}`;
  const initials   = fullName.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
  const colorClass = AVATAR_COLORS[employee.employeeId?.charCodeAt(4) % AVATAR_COLORS.length] || "bg-indigo-500";
  const docs       = employee.documents || [];

  return (
    <div className="flex flex-col gap-6">

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[60] flex items-center gap-3 px-5 py-3.5 bg-gray-900 text-white text-sm font-medium rounded-xl shadow-2xl animate-fade-in">
          <svg className="w-4 h-4 text-emerald-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          {toast}
        </div>
      )}

      {/* Back button */}
      <button
        onClick={() => navigate("/employees")}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-indigo-600 transition w-fit"
      >
        <ArrowLeft size={16} />
        Back to Employees
      </button>

      {/* ── Profile Header ───────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          {/* Avatar / Photo */}
          <div className="flex-shrink-0">
            {employee.profilePhoto ? (
              <img
                src={`${BASE_URL}/${employee.profilePhoto}`}
                alt={fullName}
                className="w-20 h-20 rounded-2xl object-cover border-4 border-indigo-50 shadow"
                onError={(e) => { e.currentTarget.style.display = "none"; e.currentTarget.nextSibling.style.display = "flex"; }}
              />
            ) : null}
            <div
              className={`w-20 h-20 rounded-2xl ${colorClass} flex items-center justify-center text-white text-2xl font-bold shadow ${employee.profilePhoto ? "hidden" : ""}`}
            >
              {initials}
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-gray-900">{fullName}</h1>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                  STATUS_STYLES[employee.status] || STATUS_STYLES.Inactive
                }`}
              >
                {employee.status === "Active" ? <UserCheck size={11} /> : <UserX size={11} />}
                {employee.status}
              </span>
            </div>
            <p className="text-sm text-gray-500">{employee.designation || "—"} · {employee.department || "—"}</p>
            <span className="mt-2 inline-block text-xs font-mono font-semibold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">
              {employee.employeeId}
            </span>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => setShowDocs(true)}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-lg hover:bg-indigo-100 transition"
            >
              <Paperclip size={15} />
              Docs {docs.length > 0 && <span className="w-5 h-5 bg-indigo-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">{docs.length}</span>}
            </button>
            <button
              onClick={() => setShowEdit(true)}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition shadow-sm"
            >
              <Pencil size={15} />
              Edit
            </button>
          </div>
        </div>
      </div>

      {/* ── Details Grid ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Personal Info */}
        <SectionCard title="Personal Information">
          <div className="flex flex-col gap-4">
            <InfoRow icon={Mail}    label="Email"   value={employee.email} />
            <InfoRow icon={Phone}   label="Phone"   value={employee.phone} />
            <InfoRow icon={MapPin}  label="Address" value={employee.address} />
          </div>
        </SectionCard>

        {/* Job Details */}
        <SectionCard title="Job Details">
          <div className="flex flex-col gap-4">
            <InfoRow icon={Building2}   label="Department"   value={employee.department} />
            <InfoRow icon={Briefcase}   label="Designation"  value={employee.designation} />
            <InfoRow icon={DollarSign}  label="Salary"       value={formatSalary(employee.salary)} />
            <InfoRow icon={Calendar}    label="Joining Date" value={formatDate(employee.joiningDate)} />
          </div>
        </SectionCard>
      </div>

      {/* ── Documents ────────────────────────────────────────────────────── */}
      <SectionCard title={`Documents (${docs.length})`}>
        {docs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center text-gray-400">
            <Paperclip size={28} className="mb-2 opacity-40" />
            <p className="text-sm">No documents attached. Click "Docs" above to upload.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {docs.map((doc) => (
              <div
                key={doc._id}
                className="flex items-center gap-3 px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl hover:border-indigo-200 hover:bg-indigo-50/20 transition group"
              >
                <div className="w-9 h-9 bg-white border border-gray-200 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                  {getFileIcon(doc.mimetype)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{doc.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {formatBytes(doc.size)} · {formatDate(doc.createdAt)}
                  </p>
                </div>
                <button
                  onClick={async () => {
                    try {
                      const res = await fetch(`${BASE_URL}/${doc.path}`);
                      const blob = await res.blob();
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url; a.download = doc.name;
                      document.body.appendChild(a); a.click(); a.remove();
                      URL.revokeObjectURL(url);
                    } catch {
                      window.open(`${BASE_URL}/${doc.path}`, "_blank");
                    }
                  }}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-100 transition opacity-0 group-hover:opacity-100"
                  title={`Download ${doc.name}`}
                >
                  <Download size={15} />
                </button>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {/* ── Modals ───────────────────────────────────────────────────────── */}
      <AddEmployeeModal
        key={employee._id}
        isOpen={showEdit}
        onClose={() => setShowEdit(false)}
        onSuccess={handleSaved}
        employee={employee}
      />
      <DocumentModal
        isOpen={showDocs}
        onClose={() => setShowDocs(false)}
        employee={employee}
        onUpdate={handleDocUpdate}
      />
    </div>
  );
};

export default EmployeeProfile;
