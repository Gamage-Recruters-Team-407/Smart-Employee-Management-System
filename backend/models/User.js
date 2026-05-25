import mongoose from "mongoose";

const userSchema=new mongoose.Schema(
    {
        name:{
            type:String,
            required:true,
        },
        email:{
            type:String,
            required:true,
            unique:true,
            lowercase: true
        },
        password:{
            type:String,
            required:true,
            minlength: 6
        },
        role:{
            type:String,
            enum:["Admin","HR","Manager","Employee"],
            default:"Employee",
        },
        resetPasswordOTP: String, 
        resetPasswordExpire: Date,
    },
  { 
    timestamps: true 
  }
);

// Add index for automatic cleanup of expired reset tokens (optional)
userSchema.index({ resetPasswordExpire: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model("User", userSchema);