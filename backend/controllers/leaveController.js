import Leave from "../models/Leave.js";
import { sendLeaveApprovalEmail } from "../services/emailService.js";
import Employee from "../models/Employee.js";

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

    const {
      leaveType,
      startDate,
      endDate,
      reason,
    } = req.body;

    const start = new Date(startDate);
    const end = new Date(endDate);

    const totalDays =
      Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

    if (totalDays <= 0) {
      return res.status(400).json({
        message: "End date must be after start date",
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
      endDate,
      totalDays,
      reason,
      medicalDocument,
    });

    await leave.save();

    res.status(201).json({
      message: "Leave application submitted successfully",
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
// Employee Leave History
// ─────────────────────────────────────────────

export const getMyLeaves =
  async (req, res) => {
    try {
      const leaves = await Leave.find({
        employee: req.user._id,
      })
        .sort({ createdAt: -1 })
        .populate(
          "reviewedBy",
          "name email"
        );

      res.status(200).json(leaves);
    } catch (error) {
      res.status(500).json({
        message: "Server error",
        error: error.message,
      });
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

      if (
        leave.employee.toString() !==
        req.user._id.toString()
      ) {
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