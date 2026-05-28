// <<<<<<< HEAD
// import bcrypt from "bcryptjs";
// import jwt from "jsonwebtoken";
// import User from "../models/User.js";

// const signToken = (userId) =>
//   jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: "7d" });

// const formatUser = (user) => ({
//   _id: user._id,
//   name: user.name,
//   email: user.email,
//   role: user.role,
// });

// // @desc    Login user
// // @route   POST /api/auth/login
// export const login = async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     if (!email || !password) {
//       return res.status(400).json({
//         success: false,
//         message: "Email and password are required",
//       });
//     }

//     const user = await User.findOne({
//       email: String(email).trim().toLowerCase(),
//     });

//     if (!user) {
//       return res.status(401).json({
//         success: false,
//         message: "Invalid email or password",
//       });
//     }

//     const passwordMatch = await bcrypt.compare(password, user.password);

//     if (!passwordMatch) {
//       return res.status(401).json({
//         success: false,
//         message: "Invalid email or password",
//       });
//     }

//     const token = signToken(user._id);

//     return res.status(200).json({
//       success: true,
//       data: {
//         token,
//         user: formatUser(user),
//       },
//     });
//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: "Login failed",
//       error: error.message,
// =======
// import Attendance from "../models/Attendance.js";
// import User from "../models/User.js";
// import bcrypt from "bcryptjs";
// import jwt from "jsonwebtoken";

// // Helper function to generate JWT
// const generateToken = (id, role) => {
//   return jwt.sign(
//     { id, role },
//     process.env.JWT_SECRET,
//     { expiresIn: "1d" }
//   );
// };

// //register user(this part was copied from dilhara)
// export const registerUser = async (req, res) => {
//   try {
//     const { name, email, password, role } = req.body;

//     // 1. Check if user already exists
//     const userExists = await User.findOne({ email });
//     if (userExists) {
//       return res.status(400).json({ message: 'User already exists' });
//     }

//     // 2. Hash password
//     const salt = await bcrypt.genSalt(10);
//     const hashedPassword = await bcrypt.hash(password, salt);

//     // 3. Create user
//     const user = await User.create({
//       name,
//       email,
//       password: hashedPassword,
//       role: role || 'Employee',
//     });

//     if (user) {
//       res.status(201).json({
//         _id: user.id,
//         name: user.name,
//         email: user.email,
//         role: user.role,
//         token: generateToken(user._id, user.role),
//       });
//     } else {
//       res.status(400).json({ message: 'Invalid user data received' });
//     }
//   } catch (error) {
//     res.status(500).json({ message: 'Server Error', error: error.message });
//   }
// };


// export const loginUser = async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     // Find user
//     const user = await User.findOne({ email });
//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     // Verify password
//     const isPasswordValid = await bcrypt.compare(password, user.password);
//     if (!isPasswordValid) {
//       return res.status(401).json({ message: "Invalid credentials" });
//     }

//     // Create attendance record with login time
//    const attendance = await Attendance.create({
//     employee: user._id,
//     loginTime: new Date(),
//     status: "Present",
//     activityStatus: true,
//    });
  
//     await attendance.save();

//     // Create JWT token
//     const token = jwt.sign(
//       { id: user._id, role: user.role },
//       process.env.JWT_SECRET,
//       { expiresIn: "1d" }
//     );

//     res.status(200).json({
//       message: "Login successful",
//       token,
//       user: {
//         id: user._id,
//         name: user.name,
//         email: user.email,
//         role: user.role,
//       },
//       attendance: {
//         id: attendance._id,
//         loginTime: attendance.loginTime,
//       },
//     });
//   } catch (error) {
//     res.status(500).json({
//       message: error.message,
// >>>>>>> 1fb63b3360fb66ed30b436aa24ad432255b11aea
//     });
//   }
// };

// <<<<<<< HEAD
// // @desc    Get logged-in user profile
// // @route   GET /api/auth/me
// export const getMe = async (req, res) => {
//   return res.status(200).json({
//     success: true,
//     data: formatUser(req.user),
//   });
// =======
// export const logoutUser = async (req, res) => {
//   try {
//     const { attendanceId } = req.body;

//     // Update attendance record with logout time
//     const attendance = await Attendance.findByIdAndUpdate(
//       attendanceId,
//       {
//         logoutTime: new Date(),
//         activityStatus: false,
//       },
//       { new: true }
//     );

//     if (!attendance) {
//       return res.status(404).json({ message: "Attendance record not found" });
//     }

//     // Calculate working hours
//     const workingHours =
//       (attendance.logoutTime - attendance.loginTime) / (1000 * 60 * 60);

//     res.status(200).json({
//       message: "Logout successful",
//       attendance,
//       workingHours: workingHours.toFixed(2),
//     });
//   } catch (error) {
//     res.status(500).json({
//       message: error.message,
//     });
//   }
// >>>>>>> 1fb63b3360fb66ed30b436aa24ad432255b11aea
// };

import Attendance from "../models/Attendance.js";
import User from "../models/User.js";

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// ─────────────────────────────────────────────
// Generate JWT
// ─────────────────────────────────────────────

const generateToken = (id, role) => {
  return jwt.sign(
    { id, role },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );
};

// ─────────────────────────────────────────────
// Format User
// ─────────────────────────────────────────────

const formatUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
});

// ─────────────────────────────────────────────
// Register User
// ─────────────────────────────────────────────

export const registerUser = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role,
    } = req.body;

    const userExists =
      await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({
        message: "User already exists",
      });
    }

    const salt =
      await bcrypt.genSalt(10);

    const hashedPassword =
      await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: role || "Employee",
    });

    res.status(201).json({
      token: generateToken(
        user._id,
        user.role
      ),

      user: formatUser(user),
    });
  } catch (error) {
    res.status(500).json({
      message: "Server Error",
      error: error.message,
    });
  }
};

// ─────────────────────────────────────────────
// Login User
// ─────────────────────────────────────────────

export const loginUser = async (
  req,
  res
) => {
  try {
    const { email, password } =
      req.body;

    if (!email || !password) {
      return res.status(400).json({
        message:
          "Email and password are required",
      });
    }

    const user = await User.findOne({
      email: String(email)
        .trim()
        .toLowerCase(),
    }).select("+password");

    if (!user) {
      return res.status(401).json({
        message:
          "Invalid email or password",
      });
    }

    const isPasswordValid =
      await bcrypt.compare(
        password,
        user.password
      );

    if (!isPasswordValid) {
      return res.status(401).json({
        message:
          "Invalid email or password",
      });
    }

    // Attendance login tracking
    const attendance =
      await Attendance.create({
        employee: user._id,
        loginTime: new Date(),
        status: "Present",
        activityStatus: true,
      });

    user.lastLogin = new Date();

    await user.save();

    const token = generateToken(
      user._id,
      user.role
    );

    res.status(200).json({
      message: "Login successful",

      token,

      user: formatUser(user),

      attendance: {
        id: attendance._id,
        loginTime:
          attendance.loginTime,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Login failed",
      error: error.message,
    });
  }
};

// ─────────────────────────────────────────────
// Logout User
// ─────────────────────────────────────────────

export const logoutUser = async (
  req,
  res
) => {
  try {
    const { attendanceId } =
      req.body;

    if (!attendanceId) {
      return res.status(400).json({
        message:
          "Attendance ID is required",
      });
    }

    const attendance =
      await Attendance.findByIdAndUpdate(
        attendanceId,
        {
          logoutTime: new Date(),
          activityStatus: false,
        },
        { new: true }
      );

    if (!attendance) {
      return res.status(404).json({
        message:
          "Attendance record not found",
      });
    }

    const workingHours =
      (attendance.logoutTime -
        attendance.loginTime) /
      (1000 * 60 * 60);

    res.status(200).json({
      message: "Logout successful",

      attendance,

      workingHours:
        workingHours.toFixed(2),
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// ─────────────────────────────────────────────
// Get Current User
// ─────────────────────────────────────────────

export const getMe = async (
  req,
  res
) => {
  res.status(200).json({
    success: true,
    user: formatUser(req.user),
  });
};