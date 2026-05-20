import mongoose from "mongoose";

const userSchema=new mongoose.Schema(
    {
        name:{
            name:String,
            required:true,
        },
        email:{
            type:String,
            required:true,
            unique:true
        },
        password:{
            type:String,
            required:true,
        },
        role:{
            String,
            enum:["Admin","HR","Manager","Employee"],
            default:"Employee",
        },
    },
    {
        timestamps:true,
    }
);

export default mongoose.model("User",userSchema)