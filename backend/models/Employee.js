import mongoose from "mongoose";

const documentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    }, // original file name

    path: {
      type: String,
      required: true,
    }, // uploads/<filename>

    mimetype: {
      role: {
        type: String,
        enum: ["Admin", "HR", "Manager", "Employee"],
        default: "Employee",
        trim: true,
      },
      type: String,
    },

    size: {
      type: Number,
    },
  },
  {
    _id: true,
    timestamps: true,
  }
);

const employeeSchema = new mongoose.Schema(
  {
    // This saves User collection ObjectId.
    // Not required, because manually created employees may not have a user account.
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
      unique: true,
      sparse: true,
    },

    employeeId: {
      type: String,
      unique: true,
    },

    firstName: {
      type: String,
      required: [true, "First name is required."],
      trim: true,
    },

    lastName: {
      type: String,
      required: [true, "Last name is required."],
      trim: true,
    },

    email: {
      type: String,
      required: [true, "Email address is required."],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        "Please provide a valid email address.",
      ],
    },

    phone: {
      type: String,
      trim: true,
      maxlength: [20, "Phone number must not exceed 20 characters."],
    },

    department: {
      type: String,
      trim: true,
    },

    designation: {
      type: String,
      trim: true,
    },

    salary: {
      type: Number,
      default: 0,
      min: [0, "Salary cannot be negative."],
    },

    joiningDate: {
      type: Date,
    },

    address: {
      type: String,
      trim: true,
      maxlength: [200, "Address must not exceed 200 characters."],
    },

    documents: {
      type: [documentSchema],
      default: [],
    },

    profilePhoto: {
      type: String,
      default: null,
    },

    status: {
      type: String,
      enum: ["Active", "Inactive", "On Leave", "Terminated"],
      default: "Active",
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Employee", employeeSchema);