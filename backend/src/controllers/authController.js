import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Role from "../models/Role.js";
// import Role from "../models/Role.js";

// 🔹 Generate JWT Token
const generateToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );
};

const setAuthCookie = (res, token) => {
  const isProd = process.env.NODE_ENV === "production";
  res.cookie("token", token, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    maxAge: 24 * 60 * 60 * 1000,
  });
};

const normalizeName = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/\s+/g, "");

const isAdminUser = (user) => {
  const roleName = normalizeName(user?.role?.name);
  const settingsPerm = user?.role?.permissions?.settings || {};
  return (
    roleName === "admin" ||
    roleName.includes("admin") ||
    Boolean(settingsPerm.manageUsers && settingsPerm.manageRoles)
  );
};

// 🔹 Register User
export const registerUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const safeEmail = String(email || "").toLowerCase().trim();

    if (!name || !safeEmail || !password || !role) {
      return res.status(400).json({ message: "Name, email, password and role are required" });
    }

    const existingUser = await User.findOne({ email: safeEmail });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const roleExists = await Role.findById(role);
    if (!roleExists) {
      return res.status(400).json({ message: "Invalid role selected" });
    }

    const user = await User.create({
      name,
      email: safeEmail,
      password,
      role,
    });

    const safeUser = await User.findById(user._id).select("-password");

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: safeUser,
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
    console.error("Error registering user", error);
  }
};

// 🔹 Login User
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const safeEmail = String(email || "").toLowerCase().trim();

    if (!safeEmail || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email: safeEmail }).populate("role");

    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: "User is inactive. Contact admin to reactivate your account." });
    }

    const safeUser = user.toObject();
    delete safeUser.password;
    const token = generateToken(user._id);
    setAuthCookie(res, token);

    res.json({
      success: true,
      token,
      user: safeUser,
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMe = async (req, res) => {
  const safeUser = req.user.toObject();
  delete safeUser.password;

  res.json({
    success: true,
    user: safeUser,
  });
};

// Get All users (Admin only)
export const getUsers = async (req, res) => {
  try {
    const users = await User.find().populate("role").select("-password");

    res.json({
      success: true,
      data: users,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, oldPassword, password, role } = req.body;
    const payload = {};

    if (typeof name === "string" && name.trim()) {
      payload.name = name.trim();
    }

    if (typeof email === "string" && email.trim()) {
      const safeEmail = email.toLowerCase().trim();
      const existingUser = await User.findOne({ email: safeEmail, _id: { $ne: id } });
      if (existingUser) {
        return res.status(400).json({ message: "Email already exists" });
      }
      payload.email = safeEmail;
    }

    if (role) {
      const roleExists = await Role.findById(role);
      if (!roleExists) {
        return res.status(400).json({ message: "Invalid role selected" });
      }
      payload.role = role;
    }

    let user = await User.findById(id).populate("role");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    Object.assign(user, payload);
    if (typeof password === "string" && password.trim()) {
      if (typeof oldPassword !== "string" || !oldPassword.trim()) {
        return res.status(400).json({ message: "Old password is required to set a new password" });
      }
      if (oldPassword.trim() === password.trim()) {
        return res.status(400).json({ message: "New password must be different from old password" });
      }
      const isMatch = await user.comparePassword(oldPassword.trim());
      if (!isMatch) {
        return res.status(400).json({ message: "Old password is incorrect" });
      }
      user.password = password.trim();
    }

    await user.save();
    user = await User.findById(id).populate("role").select("-password");

    res.json({
      success: true,
      message: "User updated successfully",
      data: user,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== "boolean") {
      return res.status(400).json({ message: "isActive must be boolean" });
    }

    if (String(req.user._id) === String(id) && !isActive) {
      return res.status(400).json({ message: "You cannot deactivate your own account" });
    }

    const targetUser = await User.findById(id).populate("role");
    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }
    if (!isActive && isAdminUser(targetUser)) {
      return res.status(400).json({ message: "Admin users cannot be deactivated" });
    }

    const updated = await User.findByIdAndUpdate(
      id,
      { isActive },
      { returnDocument: "after", runValidators: true }
    ).populate("role").select("-password");

    if (!updated) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      success: true,
      message: "User status updated successfully",
      data: updated,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (String(req.user._id) === String(id)) {
      return res.status(400).json({ message: "You cannot delete your own account" });
    }

    const deleted = await User.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Logout User

export const logoutUser = async (req, res) => {
  const isProd = process.env.NODE_ENV === "production";
  res.clearCookie("token", {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
  });

  res.json({
    success: true,
    message: "Logged out successfully",
  });
};

/*
  Bootstrap logic is intentionally commented after initial ERP setup.
  Purpose: it was used only once to create the first Admin role + Admin user
  when the database was empty and no login token existed.
  Keep this block only as reference for emergency re-initialization.

*/

/*
  Bootstrap helpers are intentionally commented after initial system setup.
  Purpose: one-time Admin role/user creation only when DB is empty.
  Re-enable only for controlled reset scenarios.

const buildAdminPermissions = () => ({
  dashboard: { view: true },
  sales: { view: true, create: true, edit: true, delete: true },
  salesOrder: { view: true, create: true, edit: true, delete: true },
  purchase: { view: true, create: true, edit: true, delete: true },
  production: { view: true, create: true, edit: true, delete: true },
  bom: { view: true, create: true, edit: true, delete: true },
  beam: { view: true, create: true, edit: true, delete: true },
  inventory: { view: true, edit: true, delete: true },
  qc: { view: true, approve: true, reject: true },
  accounts: { view: true, createInvoice: true, manageLedger: true },
  payroll: { view: true, generate: true, manage: true },
  jobWork: { view: true, issue: true, receive: true },
  dispatch: { view: true, create: true, edit: true, delete: true },
  reports: { view: true, generate: true, export: true },
  settings: { manageUsers: true, manageRoles: true },
});

export const bootstrapSystem = async (req, res) => {
  try {
    if (process.env.ENABLE_BOOTSTRAP !== "true") {
      return res.status(403).json({ message: "Bootstrap route is disabled" });
    }

    const providedSecret =
      req.headers["x-bootstrap-secret"] || req.body.bootstrapSecret;

    if (!process.env.BOOTSTRAP_SECRET || providedSecret !== process.env.BOOTSTRAP_SECRET) {
      return res.status(403).json({ message: "Invalid bootstrap secret" });
    }

    const existingUsers = await User.countDocuments();
    if (existingUsers > 0) {
      return res.status(400).json({
        message: "Bootstrap disabled because users already exist",
      });
    }

    let adminRole = await Role.findOne({ name: "Admin" });
    if (!adminRole) {
      adminRole = await Role.create({
        name: "Admin",
        permissions: buildAdminPermissions(),
      });
    }

    const {
      name = "Main Admin",
      email = "admin@erp.com",
      password = "Admin@123",
    } = req.body;
    const safeEmail = String(email || "").toLowerCase().trim();

    const existingEmail = await User.findOne({ email: safeEmail });
    if (existingEmail) {
      return res.status(400).json({ message: "Admin email already exists" });
    }

    const user = await User.create({
      name: String(name || "").trim(),
      email: safeEmail,
      password,
      role: adminRole._id,
    });

    const safeUser = await User.findById(user._id).populate("role").select("-password");
    const token = generateToken(user._id);
    setAuthCookie(res, token);

    res.status(201).json({
      success: true,
      message: "Bootstrap completed",
      token,
      role: adminRole,
      user: safeUser,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
*/

