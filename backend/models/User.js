import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      minlength: 6,
      select: false,
      required: function requiredPassword() {
        return !this.googleId;
      },
    },

    role: {
      type: String,
      enum: ["Admin", "HR", "Manager", "Employee"],
      default: "Employee",
    },

    // Password reset support
    resetPasswordToken: {
      type: String,
      select: false,
    },

    resetPasswordExpire: {
      type: Date,
      select: false,
    },

    // Optional Google login support
    googleId: {
      type: String,
      sparse: true,
      select: false,
    },

    // Account verification
    isVerified: {
      type: Boolean,
      default: true,
    },

    // Last login tracking
    lastLogin: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Auto-remove expired reset tokens
userSchema.index(
  { resetPasswordExpire: 1 },
  { expireAfterSeconds: 0 }
);

export default mongoose.model("User", userSchema);