// import mongoose from "mongoose";

// <<<<<<< HEAD
// const userSchema=new mongoose.Schema(
//     {
//         name:{
//             type:String,
//             required:true,
//         },
//         email:{
//             type:String,
//             required:true,
//             unique:true
//         },
//         password:{
//             type:String,
//             required:true,
//         },
//         role:{
//             type:String,
//             enum:["Admin","HR","Manager","Employee"],
//             default:"Employee",
//         },
// =======
// const userSchema = new mongoose.Schema(
//   {
//     name: {
//       type: String,
//       required: [true, "Name is required"],
//       trim: true,
// >>>>>>> d9a15a9db0be8ea95b979aff342d68141b4a01ba
//     },
//     email: {
//       type: String,
//       required: [true, "Email is required"],
//       unique: true,
//       lowercase: true,
//       trim: true,
//     },
//     password: {
//       type: String,
//       required: [true, "Password is required"],
//       minlength: 6,
//       select: false, // never returned in queries unless explicitly requested
//     },
//     role: {
//       type: String,
//       enum: ["Admin", "HR", "Manager", "Employee"],
//       default: "Employee",
//     },
//     // Reset Password Fields
//     resetPasswordToken: {
//       type: String,
//       select: false, // Don't return this by default
//     },
//     resetPasswordExpire: {
//       type: Date,
//       select: false,
//     },
//     // Optional: For Google OAuth
//     googleId: {
//       type: String,
//       sparse: true,
//       select: false,
//     },
//     // Optional: Account status
//     isVerified: {
//       type: Boolean,
//       default: true, // Set to false if email verification is needed
//     },
//     lastLogin: {
//       type: Date,
//     },
//   },
//   { 
//     timestamps: true 
//   }
// );

// // Add index for automatic cleanup of expired reset tokens (optional)
// userSchema.index({ resetPasswordExpire: 1 }, { expireAfterSeconds: 0 });

// export default mongoose.model("User", userSchema);


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
      select: false,
    },
    role: {
      type: String,
      enum: ["Admin", "HR", "Manager", "Employee"],
      default: "Employee",
    },
    resetPasswordToken: {
      type: String,
      select: false,
    },
    resetPasswordExpire: {
      type: Date,
      select: false,
    },
    googleId: {
      type: String,
      sparse: true,
      select: false,
    },
    isVerified: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.index({ resetPasswordExpire: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model("User", userSchema);