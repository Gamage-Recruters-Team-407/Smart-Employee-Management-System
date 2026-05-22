import React, { useState } from "react";
import {
  X,
  User,
  Mail,
  Phone,
  Building2,
  Briefcase,
  DollarSign,
  Calendar,
  MapPin,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { addEmployee } from "../services/employeeService";

// ─── Constants ────────────────────────────────────────────────────────────────
const DEPARTMENTS = [
  "Engineering", "HR", "Finance", "Marketing", "Sales",
  "Operations", "IT", "Design", "Legal", "Support",
];
const DESIGNATIONS = [
  "Software Engineer", "Senior Engineer", "Tech Lead", "Manager",
  "Senior Manager", "Director", "VP", "HR Executive", "Analyst",
  "Designer", "Intern",
];
const STATUSES = ["Active", "Inactive", "On Leave", "Terminated"];

const INITIAL_FORM = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  department: "",
  designation: "",
  salary: "",
  joiningDate: "",
  address: "",
  status: "Active",
};

// ─── Field components ─────────────────────────────────────────────────────────
const InputField = ({ label, icon: Icon, error, ...props }) => (
  <div className="flex flex-col gap-1">
    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
      {label}
    </label>
    <div className="relative">
      {Icon && (
        <Icon
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
        />
      )}
      <input
        {...props}
        className={`w-full ${Icon ? "pl-9" : "pl-3"} pr-3 py-2.5 text-sm rounded-lg border ${
          error ? "border-red-400 bg-red-50" : "border-gray-200 bg-gray-50"
        } focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition`}
      />
    </div>
    {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}
  </div>
);

const SelectField = ({ label, icon: Icon, children, error, ...props }) => (
  <div className="flex flex-col gap-1">
    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
      {label}
    </label>
    <div className="relative">
      {Icon && (
        <Icon
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
        />
      )}
      <select
        {...props}
        className={`w-full ${Icon ? "pl-9" : "pl-3"} pr-3 py-2.5 text-sm rounded-lg border ${
          error ? "border-red-400 bg-red-50" : "border-gray-200 bg-gray-50"
        } focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition appearance-none`}
      >
        {children}
      </select>
    </div>
    {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}
  </div>
);

const SectionHeading = ({ children }) => (
  <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-3">
    {children}
  </p>
);

// ─── Validation ───────────────────────────────────────────────────────────────
const validate = (form) => {
  const errors = {};
  if (!form.firstName.trim()) errors.firstName = "First name is required.";
  if (!form.lastName.trim()) errors.lastName = "Last name is required.";
  if (!form.email.trim()) errors.email = "Email is required.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
    errors.email = "Enter a valid email address.";
  if (form.salary && isNaN(Number(form.salary)))
    errors.salary = "Salary must be a number.";
  return errors;
};

// ─── Modal ────────────────────────────────────────────────────────────────────
/**
 * AddEmployeeModal
 * Collects employee details only.
 * Documents can be attached afterwards via the Upload Document button in the table.
 *
 * Props:
 *   isOpen    boolean
 *   onClose   fn
 *   onSuccess fn(newEmployee)  — called after successful creation
 */
const AddEmployeeModal = ({ isOpen, onClose, onSuccess }) => {
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError("");

    const validationErrors = validate(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...form,
        salary: form.salary ? Number(form.salary) : 0,
        joiningDate: form.joiningDate || undefined,
      };
      const result = await addEmployee(payload);
      setForm(INITIAL_FORM);
      setErrors({});
      onSuccess(result.data);
    } catch (err) {
      setApiError(
        err.response?.data?.message || "Failed to create employee. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setForm(INITIAL_FORM);
    setErrors({});
    setApiError("");
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 flex-shrink-0">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Add New Employee</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Fill in the details below. You can attach documents after saving.
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable form body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 px-6 py-5 space-y-5">

          {/* API error */}
          {apiError && (
            <div className="flex items-start gap-2.5 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
              {apiError}
            </div>
          )}

          {/* Personal Information */}
          <div>
            <SectionHeading>Personal Information</SectionHeading>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InputField
                label="First Name *" icon={User} name="firstName"
                placeholder="John" value={form.firstName}
                onChange={handleChange} error={errors.firstName}
              />
              <InputField
                label="Last Name *" icon={User} name="lastName"
                placeholder="Doe" value={form.lastName}
                onChange={handleChange} error={errors.lastName}
              />
              <InputField
                label="Email Address *" icon={Mail} name="email" type="email"
                placeholder="john.doe@company.com" value={form.email}
                onChange={handleChange} error={errors.email}
              />
              <InputField
                label="Phone" icon={Phone} name="phone" type="tel"
                placeholder="+1 555 000 0000" value={form.phone}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Job Details */}
          <div>
            <SectionHeading>Job Details</SectionHeading>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <SelectField
                label="Department" icon={Building2} name="department"
                value={form.department} onChange={handleChange}
              >
                <option value="">Select department</option>
                {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
              </SelectField>

              <SelectField
                label="Designation" icon={Briefcase} name="designation"
                value={form.designation} onChange={handleChange}
              >
                <option value="">Select designation</option>
                {DESIGNATIONS.map((d) => <option key={d} value={d}>{d}</option>)}
              </SelectField>

              <InputField
                label="Salary (USD)" icon={DollarSign} name="salary"
                type="number" min="0" placeholder="60000"
                value={form.salary} onChange={handleChange} error={errors.salary}
              />

              <InputField
                label="Joining Date" icon={Calendar} name="joiningDate"
                type="date" value={form.joiningDate} onChange={handleChange}
              />

              <SelectField
                label="Status" name="status"
                value={form.status} onChange={handleChange}
              >
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </SelectField>
            </div>
          </div>

          {/* Address */}
          <div>
            <SectionHeading>Address</SectionHeading>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Address
              </label>
              <div className="relative">
                <MapPin size={14} className="absolute left-3 top-3 text-gray-400 pointer-events-none" />
                <textarea
                  name="address" rows={2}
                  placeholder="123 Main St, City, State, ZIP"
                  value={form.address} onChange={handleChange}
                  className="w-full pl-9 pr-3 py-2.5 text-sm rounded-lg border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition resize-none"
                />
              </div>
            </div>
          </div>

          {/* Document hint */}
          <div className="flex items-center gap-3 px-4 py-3 bg-indigo-50 border border-indigo-100 rounded-xl">
            <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
            </div>
            <p className="text-xs text-indigo-700">
              <span className="font-semibold">Tip:</span> After creating the employee, use the{" "}
              <span className="font-semibold">📎 paperclip button</span> in the table row to
              upload documents (PDF, JPG, PNG).
            </p>
          </div>

        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50 flex-shrink-0">
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="px-5 py-2.5 text-sm font-medium text-gray-600 rounded-lg border border-gray-200 hover:bg-gray-100 disabled:opacity-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-5 py-2.5 text-sm font-medium text-white rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed transition flex items-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                Creating…
              </>
            ) : (
              "Create Employee"
            )}
          </button>
        </div>

      </div>
    </div>
  );
};

export default AddEmployeeModal;
