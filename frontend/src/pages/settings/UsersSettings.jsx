import { useEffect, useState } from "react";
import API from "../../api/axios";
import DataTable from "../../components/common/DataTable";
import styles from "../sales/SalesList.module.css";

const UsersSettings = () => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [errorText, setErrorText] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "",
  });

  const fetchData = async () => {
    try {
      const [usersRes, rolesRes] = await Promise.all([API.get("/auth"), API.get("/roles")]);
      setUsers(usersRes.data.data || []);
      const roleList = rolesRes.data.data || [];
      setRoles(roleList);
      if (!form.role && roleList.length > 0) {
        setForm((prev) => ({ ...prev, role: roleList[0]._id }));
      }
      setErrorText("");
    } catch (error) {
      setErrorText(error.response?.data?.message || "Failed to load settings data");
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const createUser = async (e) => {
    e.preventDefault();
    try {
      await API.post("/auth/register", form);
      setForm((prev) => ({ ...prev, name: "", email: "", password: "" }));
      await fetchData();
    } catch (error) {
      setErrorText(error.response?.data?.message || "Failed to create user");
    }
  };

  const selectedRole = roles.find((r) => r._id === form.role);

  const columns = [
    { key: "name", label: "Name" },
    { key: "email", label: "Email" },
    {
      key: "role",
      label: "Role",
      render: (row) => row.role?.name || "N/A",
    },
    {
      key: "isActive",
      label: "Active",
      render: (row) => (row.isActive ? "Yes" : "No"),
    },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>User Settings</h2>
      </div>

      <form onSubmit={createUser} style={{ marginBottom: 12, display: "grid", gap: 8 }}>
        <input name="name" value={form.name} onChange={handleChange} placeholder="User Name" required />
        <input name="email" value={form.email} onChange={handleChange} placeholder="Email" required />
        <input
          name="password"
          value={form.password}
          onChange={handleChange}
          type="password"
          placeholder="Password"
          required
        />
        <select name="role" value={form.role} onChange={handleChange} required>
          {roles.map((role) => (
            <option key={role._id} value={role._id}>
              {role.name}
            </option>
          ))}
        </select>
        {selectedRole && (
          <div style={{ fontSize: 12, color: "#374151", background: "#f8fafc", padding: 8, borderRadius: 8 }}>
            Access Preview: {Object.entries(selectedRole.permissions || {})
              .filter(([, actions]) => Object.values(actions || {}).some(Boolean))
              .map(([module]) => module)
              .join(", ")}
          </div>
        )}
        <button type="submit" className={styles.addBtn}>
          Create User
        </button>
      </form>

      {errorText && <p style={{ color: "#b91c1c" }}>{errorText}</p>}

      <DataTable columns={columns} data={users} title="users-settings" />
    </div>
  );
};

export default UsersSettings;
