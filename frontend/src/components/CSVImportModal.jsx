import { useState, useRef, useCallback } from "react";
import {
  X, Upload, CloudUpload, Loader2, AlertCircle, CheckCircle,
  FileSpreadsheet, ArrowRight, ArrowLeft, ChevronDown, Check,
} from "lucide-react";
import api from "../services/api";

// ─── Employee field mapping ───────────────────────────────────────────────────
const EMPLOYEE_FIELDS = [
  { key: "firstName", label: "First Name", required: true },
  { key: "lastName", label: "Last Name", required: true },
  { key: "email", label: "Email", required: true },
  { key: "phone", label: "Phone" },
  { key: "department", label: "Department" },
  { key: "designation", label: "Designation" },
  { key: "salary", label: "Salary" },
  { key: "joiningDate", label: "Joining Date" },
  { key: "address", label: "Address" },
  { key: "status", label: "Status" },
];

const FIELD_KEYS = EMPLOYEE_FIELDS.map((f) => f.key);

// ─── CSV parsing ──────────────────────────────────────────────────────────────
const parseCSV = (text) => {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return { headers: [], rows: [] };

  const parseLine = (line) => {
    const result = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === "," && !inQuotes) {
        result.push(current.trim());
        current = "";
      } else {
        current += ch;
      }
    }
    result.push(current.trim());
    return result;
  };

  const headers = parseLine(lines[0]);
  const rows = lines.slice(1).map((line) => parseLine(line));
  return { headers, rows };
};

// ─── Auto-detect column mapping ───────────────────────────────────────────────
const autoMap = (headers) => {
  const mapping = {};
  const aliases = {
    firstname: "firstName", first_name: "firstName", "first name": "firstName",
    lastname: "lastName", last_name: "lastName", "last name": "lastName",
    email: "email", "email address": "email", emailaddress: "email",
    phone: "phone", "phone number": "phone", phonenumber: "phone",
    department: "department", dept: "department",
    designation: "designation", title: "designation", "job title": "designation",
    salary: "salary", pay: "salary",
    joiningdate: "joiningDate", "joining date": "joiningDate", "join date": "joiningDate",
    joindate: "joiningDate", "start date": "joiningDate", startdate: "joiningDate",
    address: "address",
    status: "status",
  };

  headers.forEach((h, i) => {
    const normalized = h.toLowerCase().replace(/[^a-z0-9 ]/g, "").trim();
    const match = aliases[normalized] || aliases[normalized.replace(/\s+/g, "")];
    mapping[i] = match || "skip";
  });
  return mapping;
};

// ─── Validate a mapped row ────────────────────────────────────────────────────
const validateRow = (row) => {
  const errors = [];
  if (!row.firstName?.trim()) errors.push("First name required");
  if (!row.lastName?.trim()) errors.push("Last name required");
  if (!row.email?.trim()) errors.push("Email required");
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email.trim())) errors.push("Invalid email");
  return errors;
};

// ─── Step indicators ──────────────────────────────────────────────────────────
const Steps = ({ current }) => {
  const steps = ["Upload", "Preview & Map", "Results"];
  return (
    <div className="flex items-center justify-center gap-2 mb-6">
      {steps.map((s, i) => (
        <div key={s} className="flex items-center gap-2">
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition ${
              i < current ? "bg-emerald-500 text-white" :
              i === current ? "bg-indigo-600 text-white" :
              "bg-gray-200 text-gray-500"
            }`}
          >
            {i < current ? <Check size={13} /> : i + 1}
          </div>
          <span className={`text-xs font-medium ${i === current ? "text-gray-900" : "text-gray-400"}`}>
            {s}
          </span>
          {i < steps.length - 1 && <div className="w-8 h-0.5 bg-gray-200 mx-1" />}
        </div>
      ))}
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
/**
 * CSVImportModal
 * Multi-step CSV import: upload → preview/map → results.
 *
 * Props:
 *   isOpen    : boolean
 *   onClose   : () => void
 *   onSuccess : () => void   — called after successful import to refresh list
 */
const CSVImportModal = ({ isOpen, onClose, onSuccess }) => {
  const [step, setStep] = useState(0);
  const [file, setFile] = useState(null);
  const [csvData, setCsvData] = useState({ headers: [], rows: [] });
  const [columnMap, setColumnMap] = useState({});
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleFile = (f) => {
    if (!f) return;
    if (!f.name.endsWith(".csv")) {
      setError("Only CSV files are accepted.");
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      setError("File is too large (max 5 MB).");
      return;
    }
    setError("");
    setFile(f);

    const reader = new FileReader();
    reader.onload = (e) => {
      const parsed = parseCSV(e.target.result);
      setCsvData(parsed);
      setColumnMap(autoMap(parsed.headers));
    };
    reader.readAsText(f);
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    handleFile(e.dataTransfer.files[0]);
  }, []);

  // Build mapped rows for preview
  const mappedRows = csvData.rows.map((row) => {
    const obj = {};
    Object.entries(columnMap).forEach(([colIdx, field]) => {
      if (field !== "skip") obj[field] = row[Number(colIdx)] || "";
    });
    return obj;
  });

  const validations = mappedRows.map((row) => validateRow(row));
  const validCount = validations.filter((v) => v.length === 0).length;
  const errorCount = validations.filter((v) => v.length > 0).length;

  const handleImport = async () => {
    setImporting(true);
    setError("");
    try {
      const toImport = mappedRows.filter((_, i) => validations[i].length === 0);
      const res = await api.post("/employees/import", { employees: toImport });
      setResults(res.data.data);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || "Import failed. Please try again.");
    } finally {
      setImporting(false);
    }
  };

  const handleClose = () => {
    setStep(0);
    setFile(null);
    setCsvData({ headers: [], rows: [] });
    setColumnMap({});
    setResults(null);
    setError("");
    onClose();
  };

  const handleDone = () => {
    if (results?.created > 0) onSuccess();
    handleClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 flex-shrink-0">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Import Employees from CSV</h2>
            <p className="text-sm text-gray-500 mt-0.5">Bulk-add employees by uploading a CSV file.</p>
          </div>
          <button onClick={handleClose} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <Steps current={step} />

          {error && (
            <div className="flex items-start gap-2.5 px-4 py-3 mb-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              <AlertCircle size={15} className="flex-shrink-0 mt-0.5" /> {error}
            </div>
          )}

          {/* ── Step 0: Upload ──────────────────────────────────────────── */}
          {step === 0 && (
            <div>
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all ${
                  file ? "border-emerald-400 bg-emerald-50" : "border-gray-200 bg-gray-50 hover:border-indigo-400 hover:bg-indigo-50/40"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={(e) => handleFile(e.target.files[0])}
                />
                {file ? (
                  <>
                    <FileSpreadsheet size={36} className="text-emerald-500" />
                    <p className="text-sm font-semibold text-gray-800">{file.name}</p>
                    <p className="text-xs text-gray-500">
                      {(file.size / 1024).toFixed(1)} KB · {csvData.rows.length} data rows detected
                    </p>
                    <button
                      onClick={(e) => { e.stopPropagation(); setFile(null); setCsvData({ headers: [], rows: [] }); }}
                      className="text-xs text-red-500 hover:text-red-700"
                    >
                      Remove & choose another
                    </button>
                  </>
                ) : (
                  <>
                    <div className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center">
                      <CloudUpload size={26} className="text-indigo-500" />
                    </div>
                    <p className="text-sm font-semibold text-gray-700">
                      Drag & drop a CSV file, or <span className="text-indigo-600 underline">click to browse</span>
                    </p>
                    <p className="text-xs text-gray-400">CSV files only · Max 5 MB</p>
                  </>
                )}
              </div>

              {/* Expected format hint */}
              <div className="mt-4 px-4 py-3 bg-indigo-50 border border-indigo-100 rounded-xl">
                <p className="text-xs text-indigo-700">
                  <span className="font-bold">Expected columns:</span> firstName, lastName, email, phone, department, designation, salary, joiningDate, address, status.
                  The first row should contain headers. Column mapping can be adjusted in the next step.
                </p>
              </div>
            </div>
          )}

          {/* ── Step 1: Preview & Map ──────────────────────────────────── */}
          {step === 1 && (
            <div className="space-y-4">
              {/* Column mapping */}
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Column Mapping</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {csvData.headers.map((h, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-xs text-gray-600 truncate flex-1" title={h}>{h}</span>
                      <span className="text-xs text-gray-300">→</span>
                      <div className="relative flex-1">
                        <select
                          value={columnMap[i] || "skip"}
                          onChange={(e) => setColumnMap({ ...columnMap, [i]: e.target.value })}
                          className="w-full px-2 py-1.5 text-xs border border-gray-200 rounded-lg bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none appearance-none"
                        >
                          <option value="skip">— Skip —</option>
                          {EMPLOYEE_FIELDS.map((f) => (
                            <option key={f.key} value={f.key}>
                              {f.label}{f.required ? " *" : ""}
                            </option>
                          ))}
                        </select>
                        <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Validation summary */}
              <div className="flex items-center gap-4 px-4 py-3 bg-gray-50 rounded-xl border border-gray-100">
                <span className="text-xs font-semibold text-emerald-600">{validCount} valid</span>
                <span className="text-xs text-gray-300">|</span>
                <span className="text-xs font-semibold text-red-500">{errorCount} with errors</span>
                <span className="text-xs text-gray-300">|</span>
                <span className="text-xs text-gray-500">{csvData.rows.length} total rows</span>
              </div>

              {/* Preview table */}
              <div className="border border-gray-100 rounded-xl overflow-hidden">
                <div className="overflow-x-auto max-h-60">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left text-gray-500 font-semibold w-8">#</th>
                        <th className="px-3 py-2 text-left text-gray-500 font-semibold w-8">✓</th>
                        {EMPLOYEE_FIELDS.filter((f) => Object.values(columnMap).includes(f.key)).map((f) => (
                          <th key={f.key} className="px-3 py-2 text-left text-gray-500 font-semibold whitespace-nowrap">
                            {f.label}{f.required ? " *" : ""}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {mappedRows.slice(0, 50).map((row, i) => {
                        const errs = validations[i];
                        const hasError = errs.length > 0;
                        return (
                          <tr key={i} className={hasError ? "bg-red-50/50" : "hover:bg-gray-50/50"}>
                            <td className="px-3 py-2 text-gray-400">{i + 1}</td>
                            <td className="px-3 py-2">
                              {hasError ? (
                                <span title={errs.join(", ")} className="cursor-help">
                                  <AlertCircle size={13} className="text-red-500" />
                                </span>
                              ) : (
                                <CheckCircle size={13} className="text-emerald-500" />
                              )}
                            </td>
                            {EMPLOYEE_FIELDS.filter((f) => Object.values(columnMap).includes(f.key)).map((f) => (
                              <td key={f.key} className="px-3 py-2 text-gray-700 truncate max-w-[120px]">
                                {row[f.key] || "—"}
                              </td>
                            ))}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── Step 2: Results ─────────────────────────────────────────── */}
          {step === 2 && results && (
            <div className="flex flex-col items-center gap-5 py-4">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
                <CheckCircle size={32} className="text-emerald-500" />
              </div>
              <div className="text-center">
                <h3 className="text-lg font-bold text-gray-900">Import Complete</h3>
                <p className="text-sm text-gray-500 mt-1">
                  <span className="font-semibold text-emerald-600">{results.created}</span> employee{results.created !== 1 ? "s" : ""} created
                  {results.skipped > 0 && (
                    <>, <span className="font-semibold text-amber-600">{results.skipped}</span> skipped</>
                  )}
                </p>
              </div>
              {results.errors?.length > 0 && (
                <div className="w-full max-h-40 overflow-y-auto border border-red-100 rounded-xl">
                  <div className="px-4 py-2 bg-red-50 text-xs font-semibold text-red-600 sticky top-0">
                    Errors ({results.errors.length})
                  </div>
                  {results.errors.map((err, i) => (
                    <div key={i} className="px-4 py-2 text-xs text-red-700 border-t border-red-50">
                      Row {err.index + 1}: {err.reason}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex justify-between bg-gray-50 flex-shrink-0">
          {step === 0 && (
            <>
              <button onClick={handleClose} className="px-5 py-2.5 text-sm font-medium text-gray-600 rounded-lg border border-gray-200 hover:bg-gray-100 transition">
                Cancel
              </button>
              <button
                onClick={() => file && csvData.rows.length > 0 && setStep(1)}
                disabled={!file || csvData.rows.length === 0}
                className="px-5 py-2.5 text-sm font-medium text-white rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
              >
                Next <ArrowRight size={14} />
              </button>
            </>
          )}
          {step === 1 && (
            <>
              <button onClick={() => setStep(0)} className="px-5 py-2.5 text-sm font-medium text-gray-600 rounded-lg border border-gray-200 hover:bg-gray-100 transition flex items-center gap-2">
                <ArrowLeft size={14} /> Back
              </button>
              <button
                onClick={handleImport}
                disabled={importing || validCount === 0}
                className="px-5 py-2.5 text-sm font-medium text-white rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
              >
                {importing ? <><Loader2 size={14} className="animate-spin" /> Importing…</> : <>Import {validCount} Employee{validCount !== 1 ? "s" : ""}</>}
              </button>
            </>
          )}
          {step === 2 && (
            <button
              onClick={handleDone}
              className="ml-auto px-5 py-2.5 text-sm font-medium text-white rounded-lg bg-emerald-600 hover:bg-emerald-700 transition"
            >
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CSVImportModal;
