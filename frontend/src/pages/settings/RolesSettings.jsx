import { useEffect, useMemo, useState } from "react";
import API from "../../api/axios";
import DataTable from "../../components/common/DataTable";
import styles from "../sales/SalesList.module.css";

const RolesSettings = () => {
  const [roles, setRoles] = useState([]);
  const [templates, setTemplates] = useState({});
  const [selectedTemplate, setSelectedTemplate] = useState("ProductionManager");
  const [selectedRoleId, setSelectedRoleId] = useState("");
  const [roleName, setRoleName] = useState("");
  const [errorText, setErrorText] = useState("");

  const templateKeys = useMemo(() => Object.keys(templates), [templates]);

  const fetchData = async () => {
    try {
      const [roleRes, tplRes] = await Promise.all([API.get("/roles"), API.get("/roles/templates")]);
      setRoles(roleRes.data.data || []);
      setTemplates(tplRes.data.data || {});
      if (!selectedTemplate && Object.keys(tplRes.data.data || {}).length > 0) {
        setSelectedTemplate(Object.keys(tplRes.data.data)[0]);
      }
      if (!selectedRoleId && (roleRes.data.data || []).length > 0) {
        setSelectedRoleId(roleRes.data.data[0]._id);
      }
      setErrorText("");
    } catch (error) {
      setErrorText(error.response?.data?.message || "Failed to load roles data");
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const createFromTemplate = async (e) => {
    e.preventDefault();
    try {
      const name = roleName.trim();
      if (!name) {
        setErrorText("Role name is required");
        return;
      }
      const permissions = templates[selectedTemplate];
      if (!permissions) {
        setErrorText("Select a valid template");
        return;
      }
      await API.post("/roles", { name, permissions });
      setRoleName("");
      await fetchData();
    } catch (error) {
      setErrorText(error.response?.data?.message || "Failed to create role");
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

  const applyTemplateToRole = async () => {
    try {
      if (!selectedRoleId) {
        setErrorText("Select a role");
        return;
      }
      const permissions = templates[selectedTemplate];
      await API.put(`/roles/${selectedRoleId}`, { permissions });
      await fetchData();
    } catch (error) {
      setErrorText(error.response?.data?.message || "Failed to update role permissions");
    }
  };

  const columns = [
    { key: "name", label: "Role Name" },
    {
      key: "createdAt",
      label: "Created",
      render: (row) => new Date(row.createdAt).toLocaleDateString(),
    },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Role Settings</h2>
        <button type="button" className={styles.addBtn} onClick={seedDefaults}>
          Seed Default Roles
        </button>
      </div>

      <form onSubmit={createFromTemplate} style={{ marginBottom: 12, display: "grid", gap: 8 }}>
        <input
          value={roleName}
          onChange={(e) => setRoleName(e.target.value)}
          placeholder="New Role Name"
          required
        />
        <select value={selectedTemplate} onChange={(e) => setSelectedTemplate(e.target.value)}>
          {templateKeys.map((key) => (
            <option key={key} value={key}>
              {key}
            </option>
          ))}
        </select>
        <button type="submit" className={styles.addBtn}>
          Create Role From Template
        </button>
      </form>

      <div style={{ marginBottom: 12, display: "grid", gap: 8 }}>
        <select value={selectedRoleId} onChange={(e) => setSelectedRoleId(e.target.value)}>
          <option value="">Select Existing Role</option>
          {roles.map((role) => (
            <option key={role._id} value={role._id}>
              {role.name}
            </option>
          ))}
        </select>
        <button type="button" className={styles.addBtn} onClick={applyTemplateToRole}>
          Apply Template to Selected Role
        </button>
      </div>

      {errorText && <p style={{ color: "#b91c1c" }}>{errorText}</p>}

      <DataTable
        columns={columns}
        data={roles}
        title="roles-settings"
      />
    </div>
  );
};

export default RolesSettings;
