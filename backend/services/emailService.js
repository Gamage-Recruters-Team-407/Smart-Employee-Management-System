import nodemailer from "nodemailer";

const isEmailEnabled = () => process.env.EMAIL_ENABLED === "true";

const getSmtpConfig = () => ({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

let transporterPromise = null;

const getTransporter = async () => {
  if (!transporterPromise) {
    transporterPromise = nodemailer.createTransport(getSmtpConfig());
  }
  return transporterPromise;
};

const buildHtmlBody = ({ recipientName, title, message, type }) => `
<!DOCTYPE html>
<html>
  <body style="font-family: Arial, sans-serif; color: #1f2937; line-height: 1.5;">
    <div style="max-width: 560px; margin: 0 auto; padding: 24px;">
      <h2 style="color: #4f46e5; margin-bottom: 8px;">Smart Employee Management System</h2>
      <p style="margin-top: 0;">Hello ${recipientName || "there"},</p>
      <p>You have a new <strong>${type}</strong> notification:</p>
      <div style="background: #f3f4f6; border-radius: 12px; padding: 16px; margin: 16px 0;">
        <h3 style="margin: 0 0 8px;">${title}</h3>
        <p style="margin: 0;">${message}</p>
      </div>
      <p style="font-size: 12px; color: #6b7280;">
        This is an automated message from SEMS. Please do not reply to this email.
      </p>
    </div>
  </body>
</html>
`;

/**
 * Sends a notification email. Never throws — logs errors instead.
 */
export const sendNotificationEmail = async ({
  to,
  recipientName,
  title,
  message,
  type,
}) => {
  if (!isEmailEnabled()) {
    return { sent: false, skipped: true, reason: "EMAIL_ENABLED is not true" };
  }

  if (!to) {
    return { sent: false, skipped: true, reason: "Recipient email missing" };
  }

  const { SMTP_HOST, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env;

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    console.warn(
      "[email] SMTP not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASS in .env"
    );
    return { sent: false, skipped: true, reason: "SMTP not configured" };
  }

  try {
    const transporter = await getTransporter();
    const from =
      SMTP_FROM || `"SEMS Notifications" <${SMTP_USER}>`;

    const info = await transporter.sendMail({
      from,
      to,
      subject: `[SEMS] ${title}`,
      text: `${title}\n\n${message}\n\nType: ${type}`,
      html: buildHtmlBody({ recipientName, title, message, type }),
    });

    return { sent: true, messageId: info.messageId };
  } catch (error) {
    console.error("[email] Failed to send notification email:", error.message);
    return { sent: false, error: error.message };
  }
};

export const verifyEmailConnection = async () => {
  if (!isEmailEnabled()) {
    return { ok: false, message: "Email is disabled (EMAIL_ENABLED != true)" };
  }

  const { SMTP_HOST, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    return { ok: false, message: "SMTP credentials are incomplete" };
  }

  try {
    const transporter = await getTransporter();
    await transporter.verify();
    return { ok: true, message: "SMTP connection verified" };
  } catch (error) {
    return { ok: false, message: error.message };
  }
};
