// <<<<<<< HEAD
// export const authorizeRoles = (...allowedRoles) => {
//   return (req, res, next) => {
//     if (!req.user || !allowedRoles.includes(req.user.role)) {
//       return res.status(403).json({
//         message: `Role (${req.user?.role || 'None'}) is not allowed to access this resource`,
//       });
//     }
//     next();
//   };
// };
// =======

// export const authorize = (...roles) => {
//   return (req, res, next) => {
//     if (!req.user) {
//       return res.status(401).json({
//         success: false,
//         message: "Not authorized.",
//       });
//     }

//     if (!roles.includes(req.user.role)) {
//       return res.status(403).json({
//         success: false,
//         message: `Role '${req.user.role}' is not authorized for this action.`,
//       });
//     }

//     next();
//   };
// };


// >>>>>>> 97b4a3cbfff56a943485607dbd37af753d1149f5


/**
 * @desc Middleware to restrict route access based on User Roles (RBAC)
 * @param  {...string} roles - එකතු කළ හැකි අවසර ලත් roles (උදා: 'Admin', 'HR')
 */
export const authorize = (...roles) => {
  return (req, res, next) => {
    // 1. මුලින්ම req.user කෙනෙක් සිටීදැයි තහවුරු කරගනී (401 Not Authorized)
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Not authorized. Please log in first.",
      });
    }

    // 2. පරිශීලකයාගේ role එක අවසර දී ඇති roles ලැයිස්තුවට අයිතිදැයි බලයි (403 Forbidden)
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Role '${req.user.role}' is not authorized to access this resource.`,
      });
    }

    // 3. සියල්ල නිවැරදි නම් ඊළඟ controller එකට අවසර දෙයි
    next();
  };
};

// 💡 Compatibility එක සඳහා (HEAD එකේ තිබූ පරිදි) authorizeRoles ලෙසද මෙය පාවිච්චි කළ හැක.
export const authorizeRoles = authorize;