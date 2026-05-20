import mongoose from "mongoose"

export const connectDB=async()=>{
    try{
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Mongoose Connected");
    }catch(error){
        console.log(error.message);
        process.exit(1);
    }
}