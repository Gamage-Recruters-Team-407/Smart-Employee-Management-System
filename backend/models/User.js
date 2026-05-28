// import mongoose from "mongoose";

// const userSchema = new mongoose.Schema(
//   {
//     name: {
//       type: String,
//       required: [true, "Name is required"],
//       trim: true,
//     },
// <<<<<<< HEAD
// =======

// >>>>>>> 97b4a3cbfff56a943485607dbd37af753d1149f5
//     email: {
//       type: String,
//       required: [true, "Email is required"],
//       unique: true,
//       lowercase: true,
//       trim: true,
//     },
// <<<<<<< HEAD
// =======

// >>>>>>> 97b4a3cbfff56a943485607dbd37af753d1149f5
//     password: {
//       type: String,
//       required: [true, "Password is required"],
//       minlength: 6,
// <<<<<<< HEAD
//       select: false, // never returned in queries unless explicitly requested
//     },
// =======
//       select: false, // hidden unless explicitly selected
//     },

// >>>>>>> 97b4a3cbfff56a943485607dbd37af753d1149f5
//     role: {
//       type: String,
//       enum: ["Admin", "HR", "Manager", "Employee"],
//       default: "Employee",
//     },
// <<<<<<< HEAD
//     // Reset Password Fields
//     resetPasswordToken: {
//       type: String,
//       select: false, // Don't return this by default
//     },
// =======

//     // Password reset support
//     resetPasswordToken: {
//       type: String,
//       select: false,
//     },

// >>>>>>> 97b4a3cbfff56a943485607dbd37af753d1149f5
//     resetPasswordExpire: {
//       type: Date,
//       select: false,
//     },
// <<<<<<< HEAD
//     // Optional: For Google OAuth
// =======

//     // Optional Google login support
// >>>>>>> 97b4a3cbfff56a943485607dbd37af753d1149f5
//     googleId: {
//       type: String,
//       sparse: true,
//       select: false,
//     },
// <<<<<<< HEAD
//     // Optional: Account status
//     isVerified: {
//       type: Boolean,
//       default: true, // Set to false if email verification is needed
//     },
// =======

//     // Account verification
//     isVerified: {
//       type: Boolean,
//       default: true,
//     },

//     // Last login tracking
// >>>>>>> 97b4a3cbfff56a943485607dbd37af753d1149f5
//     lastLogin: {
//       type: Date,
//     },
//   },
// <<<<<<< HEAD
//   { 
//     timestamps: true 
//   }
// );

// // Add index for automatic cleanup of expired reset tokens (optional)
// userSchema.index({ resetPasswordExpire: 1 }, { expireAfterSeconds: 0 });

// export default mongoose.model("User", userSchema);
// =======
//   {
//     timestamps: true,
//   }
// );

// // Auto-remove expired reset tokens
// userSchema.index(
//   { resetPasswordExpire: 1 },
//   { expireAfterSeconds: 0 }
// );

// export default mongoose.model("User", userSchema);
// >>>>>>> 97b4a3cbfff56a943485607dbd37af753d1149f5


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
      required: [true, "Password is required"],
      minlength: 6,
      select: false, // Security: Never returned in queries unless explicitly requested
    },
    role: {
      type: String,
      enum: ["Admin", "HR", "Manager", "Employee"],
      default: "Employee",
    },
    // Password reset support fields
    resetPasswordToken: {
      type: String,
      select: false, // Don't return this by default
    },
    resetPasswordExpire: {
      type: Date,
      select: false,
    },
    // Optional: Google OAuth / Login support
    googleId: {
      type: String,
      sparse: true,
      select: false,
    },
    // Account verification status
    isVerified: {
      type: Boolean,
      default: true, // Set to false if email verification is needed in the future
    },
    // Last login tracking for attendance/security
    lastLogin: {
      type: Date,
    },
  },
  { 
    timestamps: true 
  }
);

// ✅ Auto-remove expired reset tokens (automatic cleanup)
userSchema.index({ resetPasswordExpire: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model("User", userSchema);