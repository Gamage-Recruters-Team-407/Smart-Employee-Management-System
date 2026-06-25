import { useState, useRef } from "react";
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
import { addEmployee, updateEmployee, uploadProfilePhoto } from "../services/employeeService";

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
const validate = (form, touchedFields = null) => {
  const errors = {};
  const check = (field) => !touchedFields || touchedFields.has(field);

  // First Name
  if (check("firstName")) {
    if (!form.firstName.trim())
      errors.firstName = "First name is required.";
    else if (form.firstName.trim().length < 2)
      errors.firstName = "First name must be at least 2 characters.";
    else if (!/^[a-zA-Z\s'-]+$/.test(form.firstName))
      errors.firstName = "First name can only contain letters, spaces, hyphens or apostrophes.";
  }

  // Last Name
  if (check("lastName")) {
    if (!form.lastName.trim())
      errors.lastName = "Last name is required.";
    else if (form.lastName.trim().length < 2)
      errors.lastName = "Last name must be at least 2 characters.";
    else if (!/^[a-zA-Z\s'-]+$/.test(form.lastName))
      errors.lastName = "Last name can only contain letters, spaces, hyphens or apostrophes.";
  }

  // Email
  if (check("email")) {
    if (!form.email.trim())
      errors.email = "Email address is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
      errors.email = "Please enter a valid email address (e.g. name@company.com).";
  }

  // Phone — Fix #6: validate characters FIRST, then digit count (dead-code was reversed)
  if (check("phone") && form.phone.trim()) {
    if (!/^[\d\s+\-()\[\]]+$/.test(form.phone.trim()))
      errors.phone = "Phone number contains invalid characters.";
    else {
      const digits = form.phone.replace(/\D/g, "");
      if (digits.length < 7 || digits.length > 15)
        errors.phone = "Phone number must be between 7 and 15 digits.";
    }
  }

  // Department
  if (check("department")) {
    if (!form.department)
      errors.department = "Please select a department.";
  }

  // Designation
  if (check("designation")) {
    if (!form.designation)
      errors.designation = "Please select a designation.";
  }

  // Salary — Fix #15: guard NaN explicitly before other checks
  if (check("salary") && form.salary !== "") {
    const sal = Number(form.salary);
    if (isNaN(sal) || form.salary.toString().trim() === "")
      errors.salary = "Salary must be a valid number.";
    else if (sal < 0)
      errors.salary = "Salary cannot be negative.";
    else if (sal > 10000000)
      errors.salary = "Salary seems unrealistically high. Please double‑check.";
  }

  // Joining Date — Fix #7: parse as local date to avoid UTC off-by-one
  if (check("joiningDate")) {
    if (!form.joiningDate) {
      errors.joiningDate = "Joining date is required.";
    } else {
      // Parse "YYYY-MM-DD" as local midnight to avoid timezone shift
      const [y, m, d] = form.joiningDate.split("-").map(Number);
      const chosen = new Date(y, m - 1, d);
      const today = new Date();
      today.setHours(23, 59, 59, 999); // allow today
      if (chosen > today)
        errors.joiningDate = "Joining date cannot be in the future.";
    }
  }

  // Address
  if (check("address") && form.address.trim()) {
    if (form.address.trim().length > 200)
      errors.address = "Address must not exceed 200 characters.";
  }

  return errors;
};

// Fix #8: Safely format a date value for an <input type="date"> without throwing
const formatDateForInput = (value) => {
  if (!value) return "";
  try {
    const d = new Date(value);
    if (isNaN(d.getTime())) return "";
    return d.toISOString().slice(0, 10);
  } catch {
    return "";
  }
};

const buildFormFromEmployee = (employee) => ({
  firstName: employee?.firstName || "",
  lastName: employee?.lastName || "",
  email: employee?.email || "",
  phone: employee?.phone || "",
  department: employee?.department || "",
  designation: employee?.designation || "",
  salary:
    employee?.salary === undefined || employee?.salary === null
      ? ""
      : String(employee.salary),
  joiningDate: formatDateForInput(employee?.joiningDate),
  address: employee?.address || "",
  status: employee?.status || "Active",
});

// ─── Modal ────────────────────────────────────────────────────────────────────
/**
 * AddEmployeeModal
 * Collects employee details only.
 * Documents can be attached afterwards via the Upload Document button in the table.
 *
 * Props:
 *   isOpen    boolean
 *   onClose   fn
 *   onSuccess fn(newEmployee)  — called after successful creation/update
 */
const AddEmployeeModal = ({ isOpen, onClose, onSuccess, employee = null }) => {
  const [form, setForm] = useState(() =>
    employee?._id ? buildFormFromEmployee(employee) : INITIAL_FORM
  );
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState(new Set());
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);
  const isEditing = Boolean(employee?._id);

  // ── Photo state ────────────────────────────────────────────────────────────
  const [photoFile, setPhotoFile] = useState(null);       // File object
  const [photoPreview, setPhotoPreview] = useState(      // preview URL
    employee?.profilePhoto ? (employee.profilePhoto.startsWith("http") ? employee.profilePhoto : `http://localhost:5000/${employee.profilePhoto}`) : null
  );
  const [photoError, setPhotoError] = useState("");
  const photoInputRef = useRef(null);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    const updatedForm = { ...form, [name]: value };
    setForm(updatedForm);
    // Re-validate only the touched field in real time
    if (touched.has(name)) {
      const fieldErrors = validate(updatedForm, new Set([name]));
      setErrors((prev) => ({ ...prev, [name]: fieldErrors[name] || "" }));
    }
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    const newTouched = new Set(touched).add(name);
    setTouched(newTouched);
    const fieldErrors = validate(form, new Set([name]));
    setErrors((prev) => ({ ...prev, [name]: fieldErrors[name] || "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError("");

    // Validate all fields on submit
    const allFields = new Set(Object.keys(INITIAL_FORM));
    const validationErrors = validate(form, allFields);
    setTouched(allFields);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    try {
      // Fix #15: Guard NaN salary before sending to the API
      const salaryNum = Number(form.salary);
      const payload = {
        ...form,
        salary: form.salary !== "" && !isNaN(salaryNum) ? salaryNum : 0,
        joiningDate: form.joiningDate || undefined,
      };
      const result = isEditing
        ? await updateEmployee(employee._id, payload)
        : await addEmployee(payload);

      // Upload photo if one was selected
      const savedEmployee = result.data;
      if (photoFile && savedEmployee?._id) {
        try {
          const photoResult = await uploadProfilePhoto(savedEmployee._id, photoFile);
          onSuccess(photoResult.data);
        } catch {
          // Photo upload failed but employee was saved — still proceed
          onSuccess(savedEmployee);
        }
      } else {
        onSuccess(savedEmployee);
      }

      // Reset local state after success (modal will be closed by parent via onSuccess)
      setForm(INITIAL_FORM);
      setErrors({});
      setPhotoFile(null);
      setPhotoPreview(null);
    } catch (err) {
      setApiError(
        err.response?.data?.message ||
          `Failed to ${isEditing ? "update" : "create"} employee. Please try again.`
      );
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setPhotoError("Only image files (JPG, PNG) are accepted.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setPhotoError("Photo must be under 2 MB.");
      return;
    }
    setPhotoError("");
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  // Fix #4: restore edit-mode data instead of always blanking the form
  const handleClose = () => {
    if (isEditing) {
      setForm(buildFormFromEmployee(employee));
    } else {
      setForm(INITIAL_FORM);
    }
    setErrors({});
    setTouched(new Set());
    setApiError("");
    setPhotoFile(null);
    setPhotoPreview(
      employee?.profilePhoto ? (employee.profilePhoto.startsWith("http") ? employee.profilePhoto : `http://localhost:5000/${employee.profilePhoto}`) : null
    );
    setPhotoError("");
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      {/* Fix #5: submit button is now INSIDE the <form> so Enter key works */}
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 flex-shrink-0">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {isEditing ? "Edit Employee" : "Add New Employee"}
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {isEditing
                ? "Update the details below. Employee ID stays unchanged."
                : "Fill in the details below. You can attach documents after saving."}
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Fix #5: form wraps everything including the footer buttons */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">

          {/* Scrollable form body */}
          <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">

            {/* API error */}
            {apiError && (
              <div className="flex items-start gap-2.5 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
                {apiError}
              </div>
            )}

            {/* ── Profile Photo ────────────────────────────────────────────── */}
            <div>
              <SectionHeading>Profile Photo</SectionHeading>
              <div className="flex items-center gap-5">
                {/* Drag-and-drop + click avatar preview */}
                <div
                  onClick={() => photoInputRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add("ring-2","ring-indigo-400","ring-offset-2"); }}
                  onDragLeave={(e) => { e.currentTarget.classList.remove("ring-2","ring-indigo-400","ring-offset-2"); }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.remove("ring-2","ring-indigo-400","ring-offset-2");
                    const file = e.dataTransfer.files[0];
                    if (!file) return;
                    if (!file.type.startsWith("image/")) { setPhotoError("Only image files (JPG, PNG) are accepted."); return; }
                    if (file.size > 2 * 1024 * 1024) { setPhotoError("Photo must be under 2 MB."); return; }
                    setPhotoError("");
                    setPhotoFile(file);
                    setPhotoPreview(URL.createObjectURL(file));
                  }}
                  className="relative w-20 h-20 rounded-full cursor-pointer flex-shrink-0 group transition"
                  title="Click or drag an image to upload"
                >
                  {photoPreview ? (
                    <img
                      src={photoPreview}
                      alt="Profile preview"
                      className="w-20 h-20 rounded-full object-cover border-4 border-indigo-100 shadow"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-indigo-100 border-4 border-indigo-200 flex items-center justify-center">
                      <User size={32} className="text-indigo-400" />
                    </div>
                  )}
                  {/* Overlay on hover */}
                  <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                    <span className="text-white text-[10px] font-bold text-center leading-tight px-1">
                      Change<br />Photo
                    </span>
                  </div>
                </div>

                {/* Info + hidden input */}
                <div className="flex flex-col gap-1.5">
                  <p className="text-sm font-medium text-gray-700">
                    {photoPreview ? "Photo selected — click avatar to change" : "Click or drag & drop a photo"}
                  </p>
                  <p className="text-xs text-gray-400">JPG or PNG · Max 2 MB</p>
                  {photoError && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle size={12} /> {photoError}
                    </p>
                  )}
                  {photoPreview && (
                    <button
                      type="button"
                      onClick={() => { setPhotoFile(null); setPhotoPreview(null); setPhotoError(""); }}
                      className="text-xs text-red-500 hover:text-red-700 text-left w-fit"
                    >
                      Remove photo
                    </button>
                  )}
                </div>

                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/jpeg,image/png"
                  className="hidden"
                  onChange={handlePhotoChange}
                />
              </div>
            </div>

            {/* Personal Information */}
            <div>
              <SectionHeading>Personal Information</SectionHeading>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InputField
                  label="First Name *" icon={User} name="firstName"
                  placeholder="Mohamed" value={form.firstName}
                  onChange={handleChange} onBlur={handleBlur} error={errors.firstName}
                />
                <InputField
                  label="Last Name *" icon={User} name="lastName"
                  placeholder="Minhaj" value={form.lastName}
                  onChange={handleChange} onBlur={handleBlur} error={errors.lastName}
                />
                <InputField
                  label="Email Address *" icon={Mail} name="email" type="email"
                  placeholder="mhmd.minhaj@company.com" value={form.email}
                  onChange={handleChange} onBlur={handleBlur} error={errors.email}
                />
                <InputField
                  label="Phone" icon={Phone} name="phone" type="tel"
                  placeholder="+94 77 123 4567" value={form.phone}
                  onChange={handleChange} onBlur={handleBlur} error={errors.phone}
                />
              </div>
            </div>

            {/* Job Details */}
            <div>
              <SectionHeading>Job Details</SectionHeading>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <SelectField
                  label="Department *" icon={Building2} name="department"
                  value={form.department} onChange={handleChange} onBlur={handleBlur}
                  error={errors.department}
                >
                  <option value="">Select department</option>
                  {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
                </SelectField>

                <SelectField
                  label="Designation *" icon={Briefcase} name="designation"
                  value={form.designation} onChange={handleChange} onBlur={handleBlur}
                  error={errors.designation}
                >
                  <option value="">Select designation</option>
                  {DESIGNATIONS.map((d) => <option key={d} value={d}>{d}</option>)}
                </SelectField>

                <InputField
                  label="Salary (USD)" icon={DollarSign} name="salary"
                  type="number" min="0" placeholder="60000"
                  value={form.salary} onChange={handleChange} onBlur={handleBlur}
                  error={errors.salary}
                />

                <InputField
                  label="Joining Date *" icon={Calendar} name="joiningDate"
                  type="date" value={form.joiningDate}
                  onChange={handleChange} onBlur={handleBlur}
                  error={errors.joiningDate}
                  max={new Date().toISOString().slice(0, 10)}
                />

                <SelectField
                  label="Status" name="status"
                  value={form.status} onChange={handleChange} onBlur={handleBlur}
                >
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </SelectField>
              </div>
            </div>

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
                    value={form.address}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`w-full pl-9 pr-3 py-2.5 text-sm rounded-lg border ${
                      errors.address ? "border-red-400 bg-red-50" : "border-gray-200 bg-gray-50"
                    } focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition resize-none`}
                  />
                </div>
                {errors.address && (
                  <p className="text-xs text-red-500 mt-0.5">{errors.address}</p>
                )}
                <p className="text-xs text-gray-400 mt-0.5">
                  {form.address.length}/200 characters
                </p>
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
                <span className="font-semibold">Tip:</span> Use the{" "}
                <span className="font-semibold">Documents button</span> in the table row to
                upload and manage documents (PDF, JPG, PNG).
              </p>
            </div>

          </div>{/* end scrollable body */}

          {/* Footer — Fix #5: buttons are inside <form> so submit fires on Enter */}
          <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50 flex-shrink-0">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="px-5 py-2.5 text-sm font-medium text-gray-600 rounded-lg border border-gray-200 hover:bg-gray-100 disabled:opacity-50 transition"
            >
              Cancel
            </button>
            {/* Fix #5: type="submit" — no longer needs onClick handler */}
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 text-sm font-medium text-white rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed transition flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  {isEditing ? "Updating..." : "Creating..."}
                </>
              ) : (
                isEditing ? "Update Employee" : "Create Employee"
              )}
            </button>
          </div>

        </form>{/* end form */}

      </div>
    </div>
  );
};

export default AddEmployeeModal;
