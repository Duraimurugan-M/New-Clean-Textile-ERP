import express from "express";
import {
  registerUser,
  loginUser,
  getMe,
  logoutUser,
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
// Bootstrap route is intentionally disabled after initial system setup.
// Purpose: this route is only for first-time admin role/user creation when DB is empty.
// Enable only for controlled one-time bootstrap in non-production environments.
// router.post("/bootstrap", bootstrapSystem);
router.get("/me", authMiddleware, getMe);
router.post("/logout", authMiddleware, logoutUser);



export default router;
