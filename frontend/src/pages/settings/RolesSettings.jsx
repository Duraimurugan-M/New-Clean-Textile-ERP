import { useEffect, useMemo, useState } from "react";
import API from "../../api/axios";
import DataTable from "../../components/common/DataTable";
import hero from "../../styles/moduleHero.module.css";
import styles from "./RolesSettings.module.css";

const MODULE_LABELS = {
  bom: "BOM",
  qc: "QC",
  jobWork: "Job Work",
  salesOrder: "Sales Order",
};

const ACTION_LABELS = {
  createInvoice: "Create Invoice",
  manageLedger: "Manage Ledger",
  manageUsers: "Manage Users",
  manageRoles: "Manage Roles",
};

const prettify = (value) =>
  String(value || "")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

const moduleLabel = (key) => MODULE_LABELS[key] || prettify(key);
const actionLabel = (key) => ACTION_LABELS[key] || prettify(key);
const formatRoleName = (value) =>
  prettify(String(value || "").trim().replace(/\s+/g, " "));

const normalizeName = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/\s+/g, "");

const buildPermissionBlueprint = (templateList, roles) => {
  const source = [
    ...(templateList || []).map((item) => item.permissions || {}),
    ...(roles || []).map((role) => role.permissions || {}),
  ];

  const blueprint = {};
  source.forEach((permissions) => {
    Object.entries(permissions || {}).forEach(([moduleKey, actions]) => {
      if (!blueprint[moduleKey]) blueprint[moduleKey] = {};
      Object.keys(actions || {}).forEach((actionKey) => {
        blueprint[moduleKey][actionKey] = false;
      });
    });
  });

  return blueprint;
};

const normalizePermissions = (permissions, blueprint) => {
  const normalized = {};
  Object.entries(blueprint || {}).forEach(([moduleKey, actions]) => {
    normalized[moduleKey] = {};
    Object.keys(actions || {}).forEach((actionKey) => {
      normalized[moduleKey][actionKey] = Boolean(permissions?.[moduleKey]?.[actionKey]);
    });
  });
  return normalized;
};

const buildTemplateList = (templates, roles) => {
  const map = new Map();

  Object.entries(templates || {}).forEach(([name, permissions]) => {
    const id = normalizeName(name);
    if (!id || map.has(id)) return;
    map.set(id, { id, label: prettify(name), permissions: permissions || {} });
  });

  (roles || []).forEach((role) => {
    const id = normalizeName(role?.name);
    if (!id) return;
    map.set(id, {
      id,
      label: formatRoleName(role.name || prettify(id)),
      permissions: role.permissions || {},
    });
  });

  return [...map.values()].sort((a, b) => a.label.localeCompare(b.label));
};

const RolesSettings = () => {
  const [roles, setRoles] = useState([]);
  const [templates, setTemplates] = useState({});
  const [roleName, setRoleName] = useState("");
  const [selectedCreateTemplate, setSelectedCreateTemplate] = useState("");
  const [selectedEditTemplate, setSelectedEditTemplate] = useState("");
  const [createPermissions, setCreatePermissions] = useState({});
  const [editRole, setEditRole] = useState(null);
  const [editName, setEditName] = useState("");
  const [editPermissions, setEditPermissions] = useState({});
  const [saving, setSaving] = useState(false);
  const [errorText, setErrorText] = useState("");

  const templateList = useMemo(
    () => buildTemplateList(templates, roles),
    [templates, roles]
  );
  const templateById = useMemo(() => {
    const map = {};
    templateList.forEach((item) => {
      map[item.id] = item;
    });
    return map;
  }, [templateList]);
  const templateKeys = useMemo(() => templateList.map((item) => item.id), [templateList]);
  const permissionBlueprint = useMemo(
    () => buildPermissionBlueprint(templateList, roles),
    [templateList, roles]
  );
  const orderedModules = useMemo(
    () =>
      Object.keys(permissionBlueprint).sort((a, b) =>
        moduleLabel(a).localeCompare(moduleLabel(b))
      ),
    [permissionBlueprint]
  );

  const fetchData = async () => {
    try {
      const [roleRes, tplRes] = await Promise.all([
        API.get("/roles"),
        API.get("/roles/templates"),
      ]);
      setRoles(roleRes.data.data || []);
      setTemplates(tplRes.data.data || {});
      setErrorText("");
    } catch (error) {
      setErrorText(error.response?.data?.message || "Failed to load roles data");
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (!templateKeys.length) return;
    if (!selectedCreateTemplate || !templateById[selectedCreateTemplate]) {
      setSelectedCreateTemplate(templateKeys[0]);
    }
    if (!selectedEditTemplate || !templateById[selectedEditTemplate]) {
      setSelectedEditTemplate(templateKeys[0]);
    }
  }, [templateKeys, selectedCreateTemplate, selectedEditTemplate, templateById]);

  useEffect(() => {
    if (!selectedCreateTemplate || !templateById[selectedCreateTemplate]) return;
    setCreatePermissions(
      normalizePermissions(templateById[selectedCreateTemplate].permissions, permissionBlueprint)
    );
  }, [selectedCreateTemplate, templateById, permissionBlueprint]);

  useEffect(() => {
    if (!editRole) return;
    if (!selectedEditTemplate || !templateById[selectedEditTemplate]) return;
    setEditPermissions(
      normalizePermissions(templateById[selectedEditTemplate].permissions, permissionBlueprint)
    );
  }, [selectedEditTemplate, templateById, permissionBlueprint, editRole]);

  const togglePermission = (setTarget, moduleKey, actionKey) => {
    setTarget((prev) => ({
      ...prev,
      [moduleKey]: {
        ...(prev[moduleKey] || {}),
        [actionKey]: !prev?.[moduleKey]?.[actionKey],
      },
    }));
  };

  const createRole = async (e) => {
    e.preventDefault();
    try {
      const name = formatRoleName(roleName);
      if (!name) {
        setErrorText("Role name is required");
        return;
      }

      setSaving(true);
      await API.post("/roles", {
        name,
        permissions: createPermissions,
      });
      setRoleName("");
      await fetchData();
    } catch (error) {
      setErrorText(error.response?.data?.message || "Failed to create role");
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (role) => {
    setEditRole(role);
    setEditName(formatRoleName(role.name || ""));
    setSelectedEditTemplate(normalizeName(role.name) || templateKeys[0] || "");
    setEditPermissions(normalizePermissions(role.permissions || {}, permissionBlueprint));
    setErrorText("");
  };

  const closeEdit = () => {
    setEditRole(null);
    setEditName("");
    setEditPermissions({});
  };

  const updateRole = async () => {
    if (!editRole?._id) return;
    try {
      setSaving(true);
      await API.put(`/roles/${editRole._id}`, {
        name: formatRoleName(editName),
        permissions: editPermissions,
      });
      closeEdit();
      await fetchData();
    } catch (error) {
      setErrorText(error.response?.data?.message || "Failed to update role");
    } finally {
      setSaving(false);
    }
  };

  const deleteRole = async (role) => {
    const ok = window.confirm(`Delete role "${formatRoleName(role.name)}"?`);
    if (!ok) return;
    try {
      await API.delete(`/roles/${role._id}`);
      await fetchData();
    } catch (error) {
      setErrorText(error.response?.data?.message || "Failed to delete role");
    }
  };

  const seedDefaults = async () => {
    try {
      await API.post("/roles/seed-defaults");
      await fetchData();
    } catch (error) {
      setErrorText(error.response?.data?.message || "Failed to seed default roles");
    }
  };

  const activeModulesText = (permissions) => {
    const modules = Object.entries(permissions || {})
      .filter(([, actions]) => Object.values(actions || {}).some(Boolean))
      .map(([moduleKey]) => moduleLabel(moduleKey));
    return modules.length ? modules.join(", ") : "No Access";
  };

  const columns = [
    { key: "name", label: "Role Name", render: (row) => formatRoleName(row.name) },
    {
      key: "access",
      label: "Access Modules",
      render: (row) => activeModulesText(row.permissions),
    },
    {
      key: "createdAt",
      label: "Created",
      render: (row) => new Date(row.createdAt).toLocaleDateString("en-GB"),
    },
    {
      key: "actions",
      label: "Actions",
      render: (row) => (
        <div className={styles.actionRow}>
          <button type="button" onClick={() => openEdit(row)}>
            Edit
          </button>
          <button type="button" onClick={() => deleteRole(row)}>
            Delete
          </button>
        </div>
      ),
    },
  ];

  const renderPermissionMatrix = (permissionState, setter) => (
    <div className={styles.permissionGrid}>
      {orderedModules.map((moduleKey) => {
        const actions = Object.keys(permissionBlueprint[moduleKey] || {}).sort((a, b) =>
          actionLabel(a).localeCompare(actionLabel(b))
        );
        return (
          <div className={styles.permissionCard} key={moduleKey}>
            <h4>{moduleLabel(moduleKey)}</h4>
            <div className={styles.checkboxList}>
              {actions.map((actionKey) => (
                <label key={`${moduleKey}-${actionKey}`} className={styles.checkboxItem}>
                  <input
                    type="checkbox"
                    checked={Boolean(permissionState?.[moduleKey]?.[actionKey])}
                    onChange={() => togglePermission(setter, moduleKey, actionKey)}
                  />
                  <span>{actionLabel(actionKey)}</span>
                </label>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );

  const uniqueRolesForTable = useMemo(() => {
    const seen = new Set();
    return [...roles]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .filter((role) => {
        const key = normalizeName(role.name);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
  }, [roles]);

  return (
    <div className={hero.pageWrapper}>
      <div className={hero.hero}>
        <div>
          <p className={hero.kicker}>Access Control</p>
          <h1 className={hero.title}>Role Settings</h1>
          <p className={hero.subtitle}>
            Create roles and control exactly which modules and actions each role can access.
          </p>
        </div>
      </div>

      <div className={styles.container}>
        <div className={styles.topActions}>
          <button type="button" className={styles.primaryBtn} onClick={seedDefaults}>
            Create Missing Default Roles
          </button>
        </div>

        <form onSubmit={createRole} className={styles.roleForm}>
          <label className={styles.field}>
            <span>New Role Name</span>
            <input
              value={roleName}
              onChange={(e) => setRoleName(e.target.value)}
              placeholder="Enter role name"
              required
            />
          </label>

          <div className={styles.templateRow}>
            <label className={styles.field}>
              <span>Permission Template</span>
                <select
                  value={selectedCreateTemplate}
                  onChange={(e) => setSelectedCreateTemplate(e.target.value)}
                >
                {templateList.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {renderPermissionMatrix(createPermissions, setCreatePermissions)}

          <button type="submit" className={styles.primaryBtn} disabled={saving}>
            {saving ? "Saving..." : "Create Role"}
          </button>
        </form>

        {errorText ? <p className={styles.error}>{errorText}</p> : null}

        <DataTable
          columns={columns}
          data={uniqueRolesForTable}
          title="roles-settings"
          showExportButtons={false}
        />
      </div>

      {editRole ? (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalCard}>
            <div className={styles.modalHeader}>
              <h3>Edit Role Permissions</h3>
              <button type="button" className={styles.closeBtn} onClick={closeEdit}>
                X
              </button>
            </div>

            <label className={styles.field}>
              <span>Role Name</span>
              <input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Enter role name"
                required
              />
            </label>

            <div className={styles.templateRow}>
              <label className={styles.field}>
                <span>Permission Template</span>
                <select
                  value={selectedEditTemplate}
                  onChange={(e) => setSelectedEditTemplate(e.target.value)}
                >
                  {templateList.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {renderPermissionMatrix(editPermissions, setEditPermissions)}

            <div className={styles.modalActions}>
              <button type="button" className={styles.secondaryBtn} onClick={closeEdit}>
                Cancel
              </button>
              <button
                type="button"
                className={styles.primaryBtn}
                onClick={updateRole}
                disabled={saving}
              >
                {saving ? "Saving..." : "Update Role"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default RolesSettings;
