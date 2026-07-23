import nodemailer from "nodemailer";

const COMPANY_NAME =
  process.env.COMPANY_NAME || "Smart Employee Management System";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

let transporter = null;

/**
 * Validates recipient address format.
 * @throws {Error} when email is missing or invalid
 */
const validateEmail = (email) => {
  const trimmed = String(email || "").trim();
  if (!trimmed) {
    throw new Error("Recipient email address is required");
  }
  if (!EMAIL_REGEX.test(trimmed)) {
    throw new Error(`Invalid email address: ${trimmed}`);
  }
  return trimmed;
};

/**
 * Ensures Gmail credentials exist before creating the transporter.
 * @throws {Error} when EMAIL_USER or EMAIL_PASS is not configured
 */
const getEmailCredentials = () => {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (!user || !pass) {
    throw new Error("Email service disabled");
  }

  return { user, pass };
};

/**
 * Returns a singleton Nodemailer transporter (Gmail).
 */
const getTransporter = () => {
  if (!transporter) {
    const { user, pass } = getEmailCredentials();
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user, pass },
    });
  }
  return transporter;
};

const formatGeneratedDate = () =>
  new Date().toLocaleString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

/**
 * Wraps arbitrary HTML content in a consistent company email layout.
 */
const buildCompanyEmailTemplate = ({ subject, htmlContent }) => `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${subject}</title>
  </head>
  <body style="margin:0;padding:0;background-color:#f4f6f8;font-family:Arial,Helvetica,sans-serif;color:#1f2937;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f4f6f8;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(15,23,42,0.08);">
            <tr>
              <td style="background:linear-gradient(135deg,#4f46e5 0%,#6366f1 100%);padding:28px 32px;">
                <p style="margin:0 0 6px;font-size:13px;letter-spacing:0.08em;text-transform:uppercase;color:#e0e7ff;">${COMPANY_NAME}</p>
                <h1 style="margin:0;font-size:22px;line-height:1.3;color:#ffffff;">${subject}</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                ${htmlContent}
                <p style="margin:24px 0 0;font-size:12px;color:#6b7280;">
                  Generated on: <strong>${formatGeneratedDate()}</strong>
                </p>
              </td>
            </tr>
            <tr>
              <td style="background-color:#f9fafb;padding:20px 32px;border-top:1px solid #e5e7eb;">
                <p style="margin:0;font-size:12px;line-height:1.6;color:#6b7280;text-align:center;">
                  This is an automated message from ${COMPANY_NAME}. Please do not reply to this email.
                  If you have questions, contact your HR department.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`;

/**
 * Core reusable email sender.
 * @param {Object} params
 * @param {string} params.to - Recipient email
 * @param {string} params.subject - Email subject line
 * @param {string} params.htmlContent - Inner HTML placed inside the company template
 * @returns {Promise<{ success: true, messageId: string, to: string }>}
 */
export const sendEmail = async ({ to, subject, htmlContent }) => {
  const recipient = validateEmail(to);

  if (!subject || !String(subject).trim()) {
    throw new Error("Email subject is required");
  }

  if (!htmlContent || !String(htmlContent).trim()) {
    throw new Error("Email htmlContent is required");
  }

  const mailSubject = String(subject).trim();

  if (process.env.EMAIL_ENABLED === "false") {
    console.log(`[EMAIL SIMULATED] To: ${recipient} | Subject: ${mailSubject}`);
    return {
      success: true,
      messageId: `simulated-${Date.now()}`,
      to: recipient,
    };
  }

  try {
    const transport = getTransporter();
    const info = await transport.sendMail({
      from: `"${COMPANY_NAME}" <${process.env.EMAIL_USER}>`,
      to: recipient,
      subject: mailSubject,
      html: buildCompanyEmailTemplate({
        subject: mailSubject,
        htmlContent: String(htmlContent).trim(),
      }),
    });

    return {
      success: true,
      messageId: info.messageId,
      to: recipient,
    };
  } catch (error) {
    if (error.message === "Email service disabled") {
      console.log(`[EMAIL SIMULATED - FALLBACK] To: ${recipient} | Subject: ${mailSubject}`);
      return {
        success: true,
        messageId: `simulated-${Date.now()}`,
        to: recipient,
      };
    }
    throw new Error(`Failed to send email: ${error.message}`);
  }
};

// ---------------------------------------------------------------------------
// Domain-specific notification helpers
// ---------------------------------------------------------------------------

/**
 * Notifies an employee that their leave request was approved or rejected.
 */
export const sendLeaveApprovalEmail = async ({
  to,
  employeeName,
  leaveType,
  startDate,
  endDate,
  status = "approved",
}) => {
  const normalizedStatus = String(status).toLowerCase();
  const isApproved = normalizedStatus === "approved";
  const subject = isApproved
    ? "Leave Request Approved"
    : "Leave Request Update";

  const htmlContent = `
    <p style="margin:0 0 16px;font-size:15px;">Dear <strong>${employeeName || "Employee"}</strong>,</p>
    <p style="margin:0 0 16px;font-size:15px;">
      Your leave request has been <strong style="color:${isApproved ? "#059669" : "#dc2626"};">${normalizedStatus}</strong>.
    </p>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f9fafb;border-radius:8px;padding:16px;margin:0 0 16px;">
      <tr><td style="padding:8px 0;font-size:14px;"><strong>Leave Type:</strong> ${leaveType || "—"}</td></tr>
      <tr><td style="padding:8px 0;font-size:14px;"><strong>Start Date:</strong> ${startDate || "—"}</td></tr>
      <tr><td style="padding:8px 0;font-size:14px;"><strong>End Date:</strong> ${endDate || "—"}</td></tr>
      <tr><td style="padding:8px 0;font-size:14px;"><strong>Status:</strong> ${normalizedStatus}</td></tr>
    </table>
    <p style="margin:0;font-size:14px;color:#4b5563;">
      ${isApproved ? "Please plan your handover accordingly and mark your calendar." : "Contact HR if you need further clarification."}
    </p>
  `;

  return sendEmail({ to, subject, htmlContent });
};

/**
 * Notifies an employee that payroll for a period has been generated.
 */
export const sendPayrollGeneratedEmail = async ({
  to,
  employeeName,
  month,
  year,
  netSalary,
  currency = "USD",
}) => {
  const period = [month, year].filter(Boolean).join(" ") || "the current period";
  const subject = `Payroll Generated — ${period}`;

  const htmlContent = `
    <p style="margin:0 0 16px;font-size:15px;">Dear <strong>${employeeName || "Employee"}</strong>,</p>
    <p style="margin:0 0 16px;font-size:15px;">
      Payroll for <strong>${period}</strong> has been processed and is now available in the system.
    </p>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f9fafb;border-radius:8px;padding:16px;margin:0 0 16px;">
      <tr><td style="padding:8px 0;font-size:14px;"><strong>Period:</strong> ${period}</td></tr>
      <tr><td style="padding:8px 0;font-size:14px;"><strong>Net Salary:</strong> ${currency} ${netSalary ?? "—"}</td></tr>
    </table>
    <p style="margin:0;font-size:14px;color:#4b5563;">
      Log in to the employee portal to review your payroll details.
    </p>
  `;

  return sendEmail({ to, subject, htmlContent });
};

/**
 * Notifies an employee that their payslip is ready for download.
 */
export const sendPayslipAvailableEmail = async ({
  to,
  employeeName,
  month,
  year,
  downloadLink,
}) => {
  const period = [month, year].filter(Boolean).join(" ") || "the current period";
  const subject = `Payslip Available — ${period}`;

  const linkBlock = downloadLink
    ? `<p style="margin:16px 0 0;">
         <a href="${downloadLink}" style="display:inline-block;background-color:#4f46e5;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:8px;font-size:14px;font-weight:bold;">
           Download Payslip
         </a>
       </p>`
    : `<p style="margin:16px 0 0;font-size:14px;color:#4b5563;">
         Sign in to the employee portal and open the Payroll section to download your payslip.
       </p>`;

  const htmlContent = `
    <p style="margin:0 0 16px;font-size:15px;">Dear <strong>${employeeName || "Employee"}</strong>,</p>
    <p style="margin:0 0 16px;font-size:15px;">
      Your payslip for <strong>${period}</strong> is now available.
    </p>
    ${linkBlock}
  `;

  return sendEmail({ to, subject, htmlContent });
};

/**
 * Notifies an employee that a new task has been assigned.
 */
export const sendTaskAssignedEmail = async ({
  to,
  employeeName,
  taskTitle,
  dueDate,
  priority = "medium",
  assignedBy,
}) => {
  const subject = `New Task Assigned: ${taskTitle || "Untitled Task"}`;

  const htmlContent = `
    <p style="margin:0 0 16px;font-size:15px;">Dear <strong>${employeeName || "Employee"}</strong>,</p>
    <p style="margin:0 0 16px;font-size:15px;">A new task has been assigned to you.</p>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f9fafb;border-radius:8px;padding:16px;margin:0 0 16px;">
      <tr><td style="padding:8px 0;font-size:14px;"><strong>Task:</strong> ${taskTitle || "—"}</td></tr>
      <tr><td style="padding:8px 0;font-size:14px;"><strong>Due Date:</strong> ${dueDate || "—"}</td></tr>
      <tr><td style="padding:8px 0;font-size:14px;"><strong>Priority:</strong> ${priority}</td></tr>
      ${assignedBy ? `<tr><td style="padding:8px 0;font-size:14px;"><strong>Assigned By:</strong> ${assignedBy}</td></tr>` : ""}
    </table>
    <p style="margin:0;font-size:14px;color:#4b5563;">
      Please review the task in your dashboard and update its status when complete.
    </p>
  `;

  return sendEmail({ to, subject, htmlContent });
};

/**
 * Notifies an employee that a performance review has been published.
 */
export const sendPerformanceReviewEmail = async ({
  to,
  employeeName,
  reviewPeriod,
  rating,
  reviewerName,
  summary,
}) => {
  const subject = `Performance Review Published — ${reviewPeriod || "Review Period"}`;

  const htmlContent = `
    <p style="margin:0 0 16px;font-size:15px;">Dear <strong>${employeeName || "Employee"}</strong>,</p>
    <p style="margin:0 0 16px;font-size:15px;">
      Your performance review for <strong>${reviewPeriod || "the recent period"}</strong> is now available.
    </p>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f9fafb;border-radius:8px;padding:16px;margin:0 0 16px;">
      <tr><td style="padding:8px 0;font-size:14px;"><strong>Review Period:</strong> ${reviewPeriod || "—"}</td></tr>
      <tr><td style="padding:8px 0;font-size:14px;"><strong>Rating:</strong> ${rating ?? "—"}</td></tr>
      <tr><td style="padding:8px 0;font-size:14px;"><strong>Reviewer:</strong> ${reviewerName || "—"}</td></tr>
    </table>
    ${
      summary
        ? `<p style="margin:0 0 16px;font-size:14px;color:#374151;"><strong>Summary:</strong> ${summary}</p>`
        : ""
    }
    <p style="margin:0;font-size:14px;color:#4b5563;">
      Log in to view the full review and discuss any feedback with your manager.
    </p>
  `;

  return sendEmail({ to, subject, htmlContent });
};

// ---------------------------------------------------------------------------
// Backward-compatible helpers used by notificationController (no controller changes)
// ---------------------------------------------------------------------------

/**
 * Verifies Gmail SMTP credentials. Used by GET /api/notifications/email-status.
 */
export const verifyEmailConnection = async () => {
  try {
    if (process.env.EMAIL_ENABLED === "false") {
      return { ok: true, message: "Email service disabled (simulated mode)" };
    }
    getEmailCredentials();
    const transport = getTransporter();
    await transport.verify();
    return { ok: true, message: "Gmail connection verified" };
  } catch (error) {
    return { ok: false, message: error.message };
  }
};

/**
 * Generic notification email — never throws; returns a result object for controllers.
 */
export const sendNotificationEmail = async ({
  to,
  recipientName,
  title,
  message,
  type,
}) => {
  if (!to) {
    return { sent: false, skipped: true, reason: "Recipient email missing" };
  }

  try {
    const htmlContent = `
      <p style="margin:0 0 16px;font-size:15px;">Hello <strong>${recipientName || "there"}</strong>,</p>
      <p style="margin:0 0 16px;font-size:15px;">You have a new <strong>${type || "system"}</strong> notification:</p>
      <div style="background-color:#f9fafb;border-radius:8px;padding:16px;">
        <h3 style="margin:0 0 8px;font-size:16px;color:#111827;">${title}</h3>
        <p style="margin:0;font-size:14px;color:#374151;">${message}</p>
      </div>
    `;

    const result = await sendEmail({
      to,
      subject: title,
      htmlContent,
    });

    return { sent: true, messageId: result.messageId };
  } catch (error) {
    console.error("[email] Failed to send notification email:", error.message);
    return { sent: false, error: error.message };
  }
};
