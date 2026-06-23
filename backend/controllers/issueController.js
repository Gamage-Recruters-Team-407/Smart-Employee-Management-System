import Issue from "../models/Issue.js";
import User from "../models/User.js";

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

const getReporterInfo = (user) => {
  return {
    reporterName: user.name || user.email,
    reporterEmail: user.email?.toLowerCase().trim(),
    reporterRole: user.role || "Employee",
  };
};

// ─────────────────────────────────────────────
// Report Issue
// ─────────────────────────────────────────────

export const reportIssue = async (req, res) => {
  try {
    const { title, description } = req.body;

    // Validation
    if (!title || !title.trim()) {
      return res.status(400).json({
        message: "Issue title is required",
      });
    }

    if (!description || !description.trim()) {
      return res.status(400).json({
        message: "Issue description is required",
      });
    }

    if (title.trim().length < 5) {
      return res.status(400).json({
        message: "Issue title must be at least 5 characters",
      });
    }

    if (description.trim().length < 10) {
      return res.status(400).json({
        message: "Issue description must be at least 10 characters",
      });
    }

    const reporterInfo = getReporterInfo(req.user);
    let attachment = null;
    let attachmentOriginalName = null;

    if (req.file) {
      attachment = req.file.path;
      attachmentOriginalName = req.file.originalname;
    }

    const issue = new Issue({
      reportedBy: req.user._id,
      title: title.trim(),
      description: description.trim(),
      attachment,
      attachmentOriginalName,
      ...reporterInfo,
    });

    await issue.save();

    res.status(201).json({
      message: "Issue reported successfully",
      issue,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// ─────────────────────────────────────────────
// Get My Issues (Employee)
// ─────────────────────────────────────────────

export const getMyIssues = async (req, res) => {
  try {
    const issues = await Issue.find({
      reportedBy: req.user._id,
    })
      .populate("reportedBy", "name email role")
      .populate("reviewedBy", "name email role")
      .sort({ createdAt: -1 });

    res.status(200).json(issues);
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// ─────────────────────────────────────────────
// Get All Issues (HR/Admin)
// ─────────────────────────────────────────────

export const getAllIssues = async (req, res) => {
  try {
    // Only HR and Admin can view all issues
    if (!["HR", "Admin"].includes(req.user.role)) {
      return res.status(403).json({
        message: "Not authorized to view all issues",
      });
    }

    const { status, priority } = req.query;
    const filter = {};

    if (status && ["Pending", "In Review", "Resolved", "Closed"].includes(status)) {
      filter.status = status;
    }

    if (priority && ["Low", "Medium", "High"].includes(priority)) {
      filter.priority = priority;
    }

    const issues = await Issue.find(filter)
      .populate("reportedBy", "name email role")
      .populate("reviewedBy", "name email role")
      .sort({ createdAt: -1 });

    res.status(200).json(issues);
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// ─────────────────────────────────────────────
// Get Issue by ID
// ─────────────────────────────────────────────

export const getIssueById = async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id)
      .populate("reportedBy", "name email role")
      .populate("reviewedBy", "name email role");

    if (!issue) {
      return res.status(404).json({
        message: "Issue not found",
      });
    }

    // Allow only reporter, HR, or Admin to view
    if (
      req.user._id.toString() !== issue.reportedBy._id.toString() &&
      !["HR", "Admin"].includes(req.user.role)
    ) {
      return res.status(403).json({
        message: "Not authorized to view this issue",
      });
    }

    res.status(200).json(issue);
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// ─────────────────────────────────────────────
// Update Issue Status (HR/Admin)
// ─────────────────────────────────────────────

export const updateIssueStatus = async (req, res) => {
  try {
    const { status, reviewNote, priority } = req.body;

    // Only HR and Admin can update status
    if (!["HR", "Admin"].includes(req.user.role)) {
      return res.status(403).json({
        message: "Not authorized to update issue status",
      });
    }

    const issue = await Issue.findById(req.params.id);

    if (!issue) {
      return res.status(404).json({
        message: "Issue not found",
      });
    }

    if (status && ["Pending", "In Review", "Resolved", "Closed"].includes(status)) {
      issue.status = status;
    }

    if (reviewNote) {
      issue.reviewNote = reviewNote.trim();
    }

    if (priority && ["Low", "Medium", "High"].includes(priority)) {
      issue.priority = priority;
    }

    issue.reviewedBy = req.user._id;

    if (status === "Resolved") {
      issue.resolvedAt = new Date();
    }

    await issue.save();

    const populated = await Issue.findById(issue._id)
      .populate("reportedBy", "name email role")
      .populate("reviewedBy", "name email role");

    res.status(200).json({
      message: `Issue status updated to ${status}`,
      issue: populated,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// ─────────────────────────────────────────────
// Edit Issue (Reporter can edit pending issues)
// ─────────────────────────────────────────────

export const editIssue = async (req, res) => {
  try {
    const { title, description } = req.body;
    const issue = await Issue.findById(req.params.id);

    if (!issue) {
      return res.status(404).json({
        message: "Issue not found",
      });
    }

    // Only reporter can edit, and only if pending
    if (req.user._id.toString() !== issue.reportedBy.toString()) {
      return res.status(403).json({
        message: "Not authorized to edit this issue",
      });
    }

    if (issue.status !== "Pending") {
      return res.status(400).json({
        message: "Only pending issues can be edited",
      });
    }

    if (title && title.trim()) {
      if (title.trim().length < 5) {
        return res.status(400).json({
          message: "Title must be at least 5 characters",
        });
      }
      issue.title = title.trim();
    }

    if (description && description.trim()) {
      if (description.trim().length < 10) {
        return res.status(400).json({
          message: "Description must be at least 10 characters",
        });
      }
      issue.description = description.trim();
    }

    await issue.save();

    const populated = await Issue.findById(issue._id)
      .populate("reportedBy", "name email role")
      .populate("reviewedBy", "name email role");

    res.status(200).json({
      message: "Issue updated successfully",
      issue: populated,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// ─────────────────────────────────────────────
// Delete Issue (Reporter can delete pending issues)
// ─────────────────────────────────────────────

export const deleteIssue = async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id);

    if (!issue) {
      return res.status(404).json({
        message: "Issue not found",
      });
    }

    // Only reporter can delete, and only if pending
    if (req.user._id.toString() !== issue.reportedBy.toString()) {
      return res.status(403).json({
        message: "Not authorized to delete this issue",
      });
    }

    if (issue.status !== "Pending") {
      return res.status(400).json({
        message: "Only pending issues can be deleted",
      });
    }

    await Issue.findByIdAndDelete(req.params.id);

    res.status(200).json({
      message: "Issue deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// ─────────────────────────────────────────────
// Get Issue Statistics (HR/Admin)
// ─────────────────────────────────────────────

export const getIssueStats = async (req, res) => {
  try {
    if (!["HR", "Admin"].includes(req.user.role)) {
      return res.status(403).json({
        message: "Not authorized",
      });
    }

    const total = await Issue.countDocuments();
    const pending = await Issue.countDocuments({ status: "Pending" });
    const inReview = await Issue.countDocuments({ status: "In Review" });
    const resolved = await Issue.countDocuments({ status: "Resolved" });
    const closed = await Issue.countDocuments({ status: "Closed" });

    const byPriority = {
      Low: await Issue.countDocuments({ priority: "Low" }),
      Medium: await Issue.countDocuments({ priority: "Medium" }),
      High: await Issue.countDocuments({ priority: "High" }),
    };

    res.status(200).json({
      total,
      byStatus: { pending, inReview, resolved, closed },
      byPriority,
    });
  } catch (error) {
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};