import User from "../models/User.js";
import bcrypt from "bcryptjs";

export const registerUser = async (req, res) => {

try {

const { name, email, password, confirmPassword, role } = req.body;

if (!name || !email || !password || !confirmPassword) {
    return res.status(400).json({
        message: "All fields are required"
    });
}

if (password !== confirmPassword) {
    return res.status(400).json({
        message: "Passwords do not match"
    });
}

const existingUser = await User.findOne({ email });

if (existingUser) {
    return res.status(400).json({
        message: "Email already registered"
    });
}

const hashedPassword = await bcrypt.hash(password, 10);

const user = await User.create({
    name,
    email,
    password: hashedPassword,
    role
});

res.status(201).json({
    success: true,
    message: "User registered successfully",
    user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
    }
});

}
catch(error){

console.log(error);

res.status(500).json({
    message:"Server Error"
});

}

};