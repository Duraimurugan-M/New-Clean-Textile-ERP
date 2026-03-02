import Role from "../models/Role.js";
import { roleTemplates } from "../utils/roleTemplates.js";

const normalizeRoleName = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/\s+/g, "");

export const createRole = async (req, res) => {
  try {
    const { name, permissions = {} } = req.body;
    const safeName = String(name || "").trim();

    if (!safeName) {
      return res.status(400).json({ message: "Role name is required" });
    }

    const allRoles = await Role.find().select("name");
    const hasSameNormalizedName = allRoles.some(
      (role) => normalizeRoleName(role.name) === normalizeRoleName(safeName)
    );
    if (hasSameNormalizedName) {
      return res.status(400).json({ message: "Role already exists" });
    }

    const role = await Role.create({
      name: safeName,
      permissions,
    });

    res.status(201).json({
      success: true,
      message: "Role created successfully",
      data: role,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getRoles = async (req, res) => {
  try {
    const roles = await Role.find();
    res.json({
      success: true,
      data: roles,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateRole = async (req, res) => {
  try {
    const { id } = req.params;
    const payload = { ...req.body };
    if (typeof payload.name === "string") {
      payload.name = payload.name.trim();
      if (!payload.name) {
        return res.status(400).json({ message: "Role name cannot be empty" });
      }
      const allRoles = await Role.find({ _id: { $ne: id } }).select("name");
      const hasSameNormalizedName = allRoles.some(
        (role) => normalizeRoleName(role.name) === normalizeRoleName(payload.name)
      );
      if (hasSameNormalizedName) {
        return res.status(400).json({ message: "Role name already exists" });
      }
    }

    const updatedRole = await Role.findByIdAndUpdate(id, payload, {
      returnDocument: "after",
      runValidators: true,
    });

    if (!updatedRole) {
      return res.status(404).json({ message: "Role not found" });
    }

    res.json({
      success: true,
      message: "Role updated successfully",
      data: updatedRole,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteRole = async (req, res) => {
  try {
    const { id } = req.params;

    const role = await Role.findByIdAndDelete(id);

    if (!role) {
      return res.status(404).json({ message: "Role not found" });
    }

    res.json({
      success: true,
      message: "Role deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getRoleTemplates = async (req, res) => {
  try {
    res.json({
      success: true,
      data: roleTemplates,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const seedDefaultRoles = async (req, res) => {
  try {
    const allRoles = await Role.find().select("name");
    const normalizedSet = new Set(
      allRoles.map((role) => normalizeRoleName(role.name))
    );
    const results = [];
    for (const [name, permissions] of Object.entries(roleTemplates)) {
      if (normalizedSet.has(normalizeRoleName(name))) {
        results.push({ name, status: "exists" });
        continue;
      }
      await Role.create({ name, permissions });
      normalizedSet.add(normalizeRoleName(name));
      results.push({ name, status: "created" });
    }

    res.json({
      success: true,
      message: "Default roles processed",
      data: results,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
