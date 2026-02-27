const checkPermission = (module, action) => {
  return (req, res, next) => {
    const role = req.user.role;
    if (role?.name === "Admin") {
      return next();
    }

    if (!role || !role.permissions[module]?.[action]) {
      return res.status(403).json({ message: "Access Denied" });
    }

    next();
  };
};

export default checkPermission;
