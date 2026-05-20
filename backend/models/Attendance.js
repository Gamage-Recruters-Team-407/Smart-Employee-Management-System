import mongoose from "mongoose";

const attendanceSchema=new mongoose.Schema(
    {
        employee:{
            type:mongoose.Schema.Types.ObjectId,
            ref:"Employee",k
        },
        loginTime:Date,
        logoutTime:Date,
        status:{
            type:String,
            enum:["Present","Late","Absent","Inactive"]
        },
        location:String,
        activityStatus:{
            type:Boolean,
            default:true
        },
    },
    {
        timestamps:true,
    }
);

export default mongoose.model("Attendance",attendanceSchema);