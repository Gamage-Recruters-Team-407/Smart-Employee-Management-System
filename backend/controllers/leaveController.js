import Leave from "../models/Leave.js";
import { sendLeaveApprovalEmail } from "../services/emailService.js";
import Employee from "../models/Employee.js";
import { resolveEmployeeForAuthUser } from "../utils/employeeUserLink.js";

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

const formatDate = (date) =>
  date
    ? new Date(date).toLocaleDateString(
      "en-US"
    )
    : "N/A";

const getEmployeeDisplayName = (
  employee
) => {
  if (!employee) return "Employee";

  if (
    employee.firstName ||
    employee.lastName
  ) {
    return `${employee.firstName || ""} ${employee.lastName || ""
      }`.trim();
  }

  return employee.name || "Employee";
};

// ─────────────────────────────────────────────
// Apply Leave
// ─────────────────────────────────────────────

export const applyLeave = async (req, res) => {
  try {
    const employeeDoc = await Employee.findOne({ email: req.user.email });

    if (!employeeDoc) {
      return res.status(404).json({
        message: "Employee profile not found for this user",
      });
    }

    const { leaveType, startDate, endDate, reason } = req.body;
    const leaveCategory = req.body.leaveCategory || "Full Day";
    const halfDaySession = req.body.halfDaySession || null;
    const startTime = req.body.startTime || null;
    const endTime = req.body.endTime || null;

    // isHalfDay arrives as a string ("true"/"false") since it's sent via FormData
    let isHalfDay = req.body.isHalfDay === "true" || req.body.isHalfDay === true;
    if (leaveCategory === "Half Day") {
      isHalfDay = true;
    }

    // 1. Required field validation
    if (!leaveType || !startDate || !reason) {
      return res.status(400).json({
        message: "Leave type, start date, and reason are required",
      });
    }

    // For Full Day leaves, endDate is required. For others, it's defaulted to startDate.
    const actualEndDate = leaveCategory === "Full Day" ? endDate : startDate;
    if (leaveCategory === "Full Day" && !endDate) {
      return res.status(400).json({
        message: "End date is required for full day leaves",
      });
    }

    const start = new Date(startDate);
    const end = new Date(actualEndDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        message: "Invalid start or end date",
      });
    }

    // Validation & calculation details based on category
    let totalDays = 0;
    let totalHours = null;

    if (leaveCategory === "Half Day") {
      totalDays = 0.5;
      if (!halfDaySession) {
        return res.status(400).json({
          message: "Session selection (Morning/Evening) is required for half day leaves",
        });
      }
    } else if (leaveCategory === "Short Leave") {
      totalDays = 0;
      if (!startTime || !endTime) {
        return res.status(400).json({
          message: "Start time and end time are required for short leaves",
        });
      }
      const [startH, startM] = startTime.split(':').map(Number);
      const [endH, endM] = endTime.split(':').map(Number);
      const diffMinutes = (endH * 60 + endM) - (startH * 60 + startM);
      if (diffMinutes <= 0) {
        return res.status(400).json({
          message: "End time must be after start time",
        });
      }
      totalHours = parseFloat((diffMinutes / 60).toFixed(2));
    } else {
      totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
      if (totalDays <= 0) {
        return res.status(400).json({
          message: "End date must be after start date",
        });
      }
    }

    // 3. Past date validation
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (start < today) {
      return res.status(400).json({
        message: "Start date cannot be in the past",
      });
    }

    // 4. Overlapping leave check
    const overlappingLeaves = await Leave.find({
      employee: employeeDoc._id,
      status: { $in: ["Pending", "Approved"] },
      startDate: { $lte: end },
      endDate: { $gte: start },
    });

    const hasOverlapping = overlappingLeaves.some(other => {
      // Full/Half Day overlapping check
      if (leaveCategory !== "Short Leave" || other.leaveCategory !== "Short Leave") {
        return true;
      }
      // If both are Short Leaves, check if their times overlap
      const parseTime = (t) => {
        const [h, m] = t.split(':').map(Number);
        return h * 60 + m;
      };
      const curStart = parseTime(startTime);
      const curEnd = parseTime(endTime);
      const otherStart = parseTime(other.startTime);
      const otherEnd = parseTime(other.endTime);

      return (curStart < otherEnd && curEnd > otherStart);
    });

    if (hasOverlapping) {
      return res.status(400).json({
        message: "You already have a leave request that overlaps with this time/date range",
      });
    }

    // 5. Leave balance check
    const leaveAllowance = {
      Annual: 14,
      Sick: 7,
      Medical: 7,
      Casual: 7,
      Maternity: 84,
      Paternity: 3,
      Unpaid: 999,
    };

    const currentYear = start.getFullYear();

    const approvedLeaves = await Leave.find({
      employee: employeeDoc._id,
      leaveType,
      status: "Approved",
      startDate: {
        $gte: new Date(`${currentYear}-01-01`),
        $lte: new Date(`${currentYear}-12-31`),
      },
    });

    const usedDays = approvedLeaves.reduce(
      (sum, l) => sum + l.totalDays,
      0
    );
    const allowance = leaveAllowance[leaveType] ?? 0;

    if (usedDays + totalDays > allowance) {
      return res.status(400).json({
        message: `Insufficient leave balance. You have ${Math.max(
          0,
          allowance - usedDays
        )} ${leaveType} day(s) remaining this year`,
      });
    }

    let medicalDocument = null;
    if (req.file) {
      medicalDocument = req.file.path;
    }

    const leave = new Leave({
      employee: employeeDoc._id,
      leaveType,
      startDate,
      endDate: actualEndDate,
      totalDays,
      isHalfDay,
      leaveCategory,
      halfDaySession,
      startTime,
      endTime,
      totalHours,
      reason,
      medicalDocument,
    });

    await leave.save();

    res.status(201).json({
      message: "Leave application submitted successfully",
      leave,
    });
  } catch (error) {
    // Clean validation error messages instead of generic 500
    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: Object.values(error.errors)
          .map((e) => e.message)
          .join(", "),
      });
    }
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// ─────────────────────────────────────────────
// Employee Leave History
// ─────────────────────────────────────────────

export const getMyLeaves = async (req, res) => {
  try {
    const employee = await resolveEmployeeForAuthUser(req.user, { createIfMissing: true });

    if (!employee) {
      return res.status(404).json({ message: "Employee profile not found." });
    }

    const leaves = await Leave.find({ employee: employee._id })
      .sort({ createdAt: -1 })
      .populate("reviewedBy", "name email");

    res.status(200).json(leaves);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// ─────────────────────────────────────────────
// Get All Leaves
// ─────────────────────────────────────────────

export const getAllLeaves =
  async (req, res) => {
    try {
      const leaves = await Leave.find()
        .populate(
          "employee",
          "firstName lastName email department"
        )
        .sort({ createdAt: -1 });

      res.status(200).json(leaves);
    } catch (error) {
      res.status(500).json({
        message: "Server error",
        error: error.message,
      });
    }
  };

// ─────────────────────────────────────────────
// Approve / Reject Leave
// ─────────────────────────────────────────────

export const updateLeaveStatus =
  async (req, res) => {
    try {
      const { id } = req.params;

      const { status, reviewNote } =
        req.body;

      if (
        !["Approved", "Rejected"].includes(
          status
        )
      ) {
        return res.status(400).json({
          message: "Invalid status",
        });
      }

      const leave =
        await Leave.findById(id);

      if (!leave) {
        return res.status(404).json({
          message: "Leave not found",
        });
      }

      if (leave.status !== "Pending") {
        return res.status(400).json({
          message:
            "Only pending leaves can be reviewed",
        });
      }

      const reviewerEmployeeDoc = await Employee.findOne({
        email: req.user.email,
      });

      if (
        reviewerEmployeeDoc &&
        leave.employee.toString() === reviewerEmployeeDoc._id.toString()
      ) {
        return res.status(403).json({
          message:
            "You cannot approve or reject your own leave request",
        });
      }

      leave.status = status;

      leave.reviewNote =
        reviewNote || null;

      leave.reviewedBy =
        req.user._id;

      leave.reviewedAt = new Date();

      await leave.save();

      // Send email if approved
      if (status === "Approved") {
        try {
          const leaveWithEmployee =
            await Leave.findById(
              leave._id
            ).populate(
              "employee",
              "email firstName lastName name"
            );

          const employee =
            leaveWithEmployee?.employee;

          if (employee?.email) {
            await sendLeaveApprovalEmail(
              {
                to: employee.email,

                employeeName:
                  getEmployeeDisplayName(
                    employee
                  ),

                leaveType:
                  leave.leaveType,

                startDate:
                  formatDate(
                    leave.startDate
                  ),

                endDate:
                  formatDate(
                    leave.endDate
                  ),

                status: "approved",
              }
            );
          }
        } catch (emailError) {
          console.error(
            "[email] Leave approval email failed:",
            emailError.message
          );
        }
      }

      res.status(200).json({
        message: `Leave ${status} successfully`,
        leave,
      });
    } catch (error) {
      res.status(500).json({
        message: "Server error",
        error: error.message,
      });
    }
  };

// ─────────────────────────────────────────────
// Cancel Leave
// ─────────────────────────────────────────────

export const cancelLeave =
  async (req, res) => {
    try {
      const { id } = req.params;

      const leave =
        await Leave.findById(id);

      if (!leave) {
        return res.status(404).json({
          message: "Leave not found",
        });
      }

      const isPrivileged = ["Admin", "HR", "Manager"].includes(req.user?.role);
      const employeeDoc = await resolveEmployeeForAuthUser(req.user, { createIfMissing: true });
      const isOwnLeave = employeeDoc && leave.employee.toString() === employeeDoc._id.toString();

      if (!isPrivileged && !isOwnLeave) {
        return res.status(403).json({
          message: "Not authorized",
        });
      }

      if (leave.status !== "Pending") {
        return res.status(400).json({
          message:
            "Only pending leaves can be cancelled",
        });
      }

      leave.status = "Cancelled";

      await leave.save();

      res.status(200).json({
        message:
          "Leave cancelled successfully",
        leave,
      });
    } catch (error) {
      res.status(500).json({
        message: "Server error",
        error: error.message,
      });
    }
  };

// ─────────────────────────────────────────────
// Leave Balance
// ─────────────────────────────────────────────

export const getLeaveBalance =
  async (req, res) => {
    try {
      const employeeId =
        req.user._id;

      const currentYear =
        new Date().getFullYear();

      const leaveAllowance = {
        Annual: 14,
        Sick: 7,
        Casual: 7,
        Maternity: 84,
        Paternity: 3,
        Unpaid: 999,
      };

      const approvedLeaves =
        await Leave.find({
          employee: employeeId,

          status: "Approved",

          startDate: {
            $gte: new Date(
              `${currentYear}-01-01`
            ),

            $lte: new Date(
              `${currentYear}-12-31`
            ),
          },
        });

      const usedDays = {};

      approvedLeaves.forEach(
        (leave) => {
          if (
            !usedDays[leave.leaveType]
          ) {
            usedDays[
              leave.leaveType
            ] = 0;
          }

          usedDays[
            leave.leaveType
          ] += leave.totalDays;
        }
      );

      const balance = {};

      for (const [
        type,
        total,
      ] of Object.entries(
        leaveAllowance
      )) {
        const used =
          usedDays[type] || 0;

        balance[type] = {
          total,
          used,
          remaining: Math.max(
            0,
            total - used
          ),
        };
      }

      res.status(200).json({
        year: currentYear,
        balance,
      });
    } catch (error) {
      res.status(500).json({
        message: "Server error",
        error: error.message,
      });
    }
  };

export const revertLeaveStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const leave = await Leave.findById(id);

    if (!leave) {
      return res.status(404).json({
        message: "Leave not found",
      });
    }

    if (!["Approved", "Rejected"].includes(leave.status)) {
      return res.status(400).json({
        message: "Only approved or rejected leaves can be reverted",
      });
    }

    leave.status = "Pending";
    leave.reviewedBy = null;
    leave.reviewedAt = null;
    leave.reviewNote = null;

    await leave.save();

    res.status(200).json({
      message: "Leave reverted to Pending successfully",
      leave,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

export const deleteLeave = async (req, res) => {
  try {
    const { id } = req.params;
    const leave = await Leave.findById(id);

    if (!leave) {
      return res.status(404).json({
        message: "Leave not found",
      });
    }

    await Leave.findByIdAndDelete(id);

    res.status(200).json({
      message: "Leave deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};