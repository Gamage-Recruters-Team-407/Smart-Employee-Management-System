import API from "./api.js";
import { hasAuthToken } from "../utils/authToken.js";

const ensureAuthenticated = () => {
  if (!hasAuthToken()) {
    throw new Error("Please sign in to download PDFs.");
  }
};

const triggerBrowserDownload = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

const extractFilename = (contentDisposition, fallback) => {
  if (!contentDisposition) return fallback;
  const match = contentDisposition.match(/filename="?([^"]+)"?/i);
  return match?.[1] || fallback;
};

const parseBlobError = async (blob) => {
  try {
    const text = await blob.text();
    const payload = JSON.parse(text);
    return payload.message || "Failed to download PDF";
  } catch {
    return "Failed to download PDF";
  }
};

export const downloadPdfFromApi = async (url, fallbackFilename) => {
  ensureAuthenticated();

  let response;
  try {
    response = await API.get(url, { responseType: "blob" });
  } catch (err) {
    if (err.response?.status === 401) {
      throw new Error("Session expired. Please sign in again.");
    }
    if (err.response?.data instanceof Blob) {
      throw new Error(await parseBlobError(err.response.data));
    }
    throw err;
  }

  const contentType = response.headers["content-type"] || "";
  if (contentType.includes("application/json")) {
    throw new Error(await parseBlobError(response.data));
  }

  const filename = extractFilename(
    response.headers["content-disposition"],
    fallbackFilename
  );

  const blob = new Blob([response.data], { type: "application/pdf" });
  triggerBrowserDownload(blob, filename);
};

export const fetchPayrollsForPdf = async () => {
  ensureAuthenticated();
  const response = await API.get("/notifications/reports/payrolls");
  return response.data?.data ?? [];
};

export const downloadPayslipPdf = (payroll) => {
  const employeeId = payroll.employee?._id || payroll.employee;
  const [month, year] = (payroll.month || "").split(" ");
  return downloadPdfFromApi(
    `/payroll/payslip?employeeId=${employeeId}&month=${month}&year=${year}`,
    "payslip.pdf"
  );
};

export const downloadDemoPayslipPdf = () =>
  downloadPdfFromApi(
    "/notifications/reports/payslip/demo",
    "payslip-demo.pdf"
  );

export const downloadAttendanceReportPdf = () =>
  downloadPdfFromApi(
    "/notifications/reports/attendance",
    "attendance-report.pdf"
  );

export const downloadLeaveReportPdf = () =>
  downloadPdfFromApi("/notifications/reports/leave", "leave-report.pdf");

export const downloadPerformanceReportPdf = () =>
  downloadPdfFromApi(
    "/notifications/reports/performance",
    "performance-report.pdf"
  );
