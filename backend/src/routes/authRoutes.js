import express from "express";
import {
  registerUser,
  loginUser,
  getMe,
  logoutUser,
  getUsers,
  updateUser,
  updateUserStatus,
  deleteUser,
  // bootstrapSystem,
} from "../controllers/authController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import checkPermission from "../middleware/permissionMiddleware.js";

const router = express.Router();

router.post(
  "/register",
  authMiddleware,
  checkPermission("settings", "manageUsers"),
  registerUser
);

router.post("/login", loginUser);
// Bootstrap route for first-time setup after a fresh DB reset.
// Controlled by ENABLE_BOOTSTRAP=true and BOOTSTRAP_SECRET validation.
// router.post("/bootstrap", bootstrapSystem);
router.get("/me", authMiddleware, getMe);
router.get("/", authMiddleware, checkPermission("settings", "manageUsers"), getUsers);
router.put("/:id", authMiddleware, checkPermission("settings", "manageUsers"), updateUser);
router.patch("/:id/status", authMiddleware, checkPermission("settings", "manageUsers"), updateUserStatus);
router.delete("/:id", authMiddleware, checkPermission("settings", "manageUsers"), deleteUser);
router.post("/logout", authMiddleware, logoutUser);



export default router;
