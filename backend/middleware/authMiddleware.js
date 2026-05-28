// <<<<<<< HEAD
// import jwt from 'jsonwebtoken';
// import User from '../models/User.js';
// =======
// import jwt from "jsonwebtoken";
// import User from "../models/User.js";
// >>>>>>> 97b4a3cbfff56a943485607dbd37af753d1149f5

// export const protect = async (req, res, next) => {
//   let token;

//   if (
//     req.headers.authorization &&
// <<<<<<< HEAD
//     req.headers.authorization.startsWith('Bearer')
//   ) {
//     try {
//       // Get token from header (Format: "Bearer <token>")
//       token = req.headers.authorization.split(' ')[1];

//       // Verify token
//       const decoded = jwt.verify(token, process.env.JWT_SECRET);

//       // Get user from the token payload, exclude the password from the result
//       req.user = await User.findById(decoded.id).select('-password');

//       next();
//     } catch (error) {
//       res.status(401).json({ message: 'Not authorized, token failed' });
//     }
//   }

//   if (!token) {
//     res.status(401).json({ message: 'Not authorized, no token' });
//   }
// };
// =======
//     req.headers.authorization.startsWith("Bearer")
//   ) {
//     token = req.headers.authorization.split(" ")[1];
//   }

//   if (!token) {
//     return res.status(401).json({
//       success: false,
//       message: "Not authorized. No token provided.",
//     });
//   }

//   try {
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);

//     const user = await User.findById(decoded.id).select("-password");

//     if (!user) {
//       return res.status(401).json({
//         success: false,
//         message: "Not authorized. User not found.",
//       });
//     }

//     req.user = user;
//     next();
//   } catch (error) {
//     return res.status(401).json({
//       success: false,
//       message: "Not authorized. Invalid token.",
//     });
//   }
// };
// >>>>>>> 97b4a3cbfff56a943485607dbd37af753d1149f5


import jwt from "jsonwebtoken";
import User from "../models/User.js";

/**
 * @desc Middleware to protect routes and verify JWT tokens
 */
export const protect = async (req, res, next) => {
  let token;

  // 1. Check for token in Authorization header (Format: "Bearer <token>")
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  // 2. Token එකක් නැතිනම් එවලේම response එකක් යවා ශ්‍රිතය නවත්වයි (Return කරයි)
  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Not authorized. No token provided.",
    });
  }

  try {
    // 3. Token එක verify කිරීම
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 4. Token එක ඇතුළේ තියෙන ID එකෙන් User ව සොයා ගැනීම (Password එක හැර)
    const user = await User.findById(decoded.id).select("-password");

    // 5. යම් හෙයකින් User ව database එකෙන් ඉවත් කර ඇත්නම්
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Not authorized. User not found.",
      });
    }

    // 6. ඊළඟ route/middleware එකට පාවිච්චි කිරීමට req object එකට user ව එකතු කරයි
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Not authorized. Invalid or expired token.",
      error: error.message
    });
  }
};