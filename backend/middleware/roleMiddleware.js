export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized." });
    }

    const isAllowed = allowedRoles.includes(req.user.role);
    if (!isAllowed) {
      return res.status(403).json({ message: "Forbidden: insufficient permissions." });
    }

    next();
  };
};

export const managerRoles = ["Manager", "Admin", "HR"];
