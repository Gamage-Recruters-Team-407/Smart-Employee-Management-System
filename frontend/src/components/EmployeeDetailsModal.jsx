import { X, Mail, Phone, Building2, Briefcase, Calendar, Shield, MapPin, Hash, User, UserCheck, UserX, ShieldAlert } from "lucide-react";

// ─── Constants & Badges ──────────────────────────────────────────────────────
const STATUS_STYLES = {
  Active: "bg-emerald-100 text-emerald-700 border border-emerald-200",
  Inactive: "bg-gray-100 text-gray-600 border border-gray-200",
  "On Leave": "bg-amber-100 text-amber-700 border border-amber-200",
  Terminated: "bg-red-100 text-red-700 border border-red-200",
};

const ROLE_STYLES = {
  Admin: "bg-purple-100 text-purple-700 border border-purple-200",
  HR: "bg-pink-100 text-pink-700 border border-pink-200",
  Manager: "bg-blue-100 text-blue-700 border border-blue-200",
  Employee: "bg-indigo-100 text-indigo-700 border border-indigo-200",
};

const StatusBadge = ({ status }) => (
  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_STYLES[status] || STATUS_STYLES.Inactive}`}>
    {status === "Active" ? <UserCheck size={11} /> : <UserX size={11} />}
    {status}
  </span>
);

const RoleBadge = ({ role }) => {
  const getIcon = () => {
    switch (role) {
      case "Admin": return <ShieldAlert size={11} />;
      case "Manager": return <Shield size={11} />;
      case "HR": return <Briefcase size={11} />;
      default: return <User size={11} />;
    }
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${ROLE_STYLES[role] || ROLE_STYLES.Employee}`}>
      {getIcon()}
      {role}
    </span>
  );
};

const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const EmployeeDetailsModal = ({ isOpen, onClose, employee }) => {
  if (!isOpen || !employee) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex flex-col items-center justify-center px-6 pt-8 pb-6 border-b border-gray-100 relative bg-gradient-to-b from-indigo-50/50 to-white">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition"
          >
            <X size={20} />
          </button>
          
          <div className="w-20 h-20 rounded-2xl bg-indigo-600 text-white flex items-center justify-center text-3xl font-bold shadow-lg shadow-indigo-200 mb-4 overflow-hidden">
            {employee.profilePhoto ? (
              <img src={employee.profilePhoto} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              `${employee.firstName?.[0] || ""}${employee.lastName?.[0] || ""}`
            )}
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900">{employee.firstName} {employee.lastName}</h2>
          <p className="text-sm text-gray-500 mt-1">{employee.designation || "—"}</p>
          
          <div className="flex gap-2 mt-4">
            <StatusBadge status={employee.status} />
            <RoleBadge role={employee.role} />
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6 bg-gray-50/50">
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                <Hash size={18} className="text-indigo-600" />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase">Employee ID</p>
                <p className="text-sm font-medium text-gray-900">{employee.employeeId || "—"}</p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                <Mail size={18} className="text-blue-600" />
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase">Email Address</p>
                <p className="text-sm font-medium text-gray-900">{employee.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col gap-1">
                <div className="flex items-center gap-2 text-gray-500 mb-1">
                  <Building2 size={16} />
                  <span className="text-xs font-semibold uppercase">Department</span>
                </div>
                <p className="text-sm font-medium text-gray-900">{employee.department || "—"}</p>
              </div>

              <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col gap-1">
                <div className="flex items-center gap-2 text-gray-500 mb-1">
                  <Calendar size={16} />
                  <span className="text-xs font-semibold uppercase">Joined Date</span>
                </div>
                <p className="text-sm font-medium text-gray-900">{formatDate(employee.joiningDate)}</p>
              </div>
            </div>
            
            {(employee.phone || employee.address) && (
              <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-3 mt-4">
                {employee.phone && (
                  <div className="flex items-center gap-3">
                    <Phone size={16} className="text-gray-400" />
                    <p className="text-sm font-medium text-gray-900">{employee.phone}</p>
                  </div>
                )}
                {employee.address && (
                  <div className="flex items-start gap-3">
                    <MapPin size={16} className="text-gray-400 mt-0.5" />
                    <p className="text-sm font-medium text-gray-900 leading-snug">{employee.address}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDetailsModal;
