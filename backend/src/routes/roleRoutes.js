import express from "express";
import {
  createRole,
  getRoles,
  updateRole,
  deleteRole,
  getRoleTemplates,
  seedDefaultRoles,
} from "../controllers/roleController.js";

import authMiddleware from "../middleware/authMiddleware.js";
import checkPermission from "../middleware/permissionMiddleware.js";

const router = express.Router();

router.post(
  "/",
  authMiddleware,
  checkPermission("settings", "manageRoles"),
  createRole
);

router.get(
  "/templates",
  authMiddleware,
  checkPermission("settings", "manageRoles"),
  getRoleTemplates
);

router.post(
  "/seed-defaults",
  authMiddleware,
  checkPermission("settings", "manageRoles"),
  seedDefaultRoles
);

router.get(
  "/",
  authMiddleware,
  checkPermission("settings", "manageRoles"),
  getRoles
);

router.put(
  "/:id",
  authMiddleware,
  checkPermission("settings", "manageRoles"),
  updateRole
);

router.delete(
  "/:id",
  authMiddleware,
  checkPermission("settings", "manageRoles"),
  deleteRole
);

export default router;
