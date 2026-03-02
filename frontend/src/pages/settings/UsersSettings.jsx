import { useEffect, useMemo, useState } from "react";
import API from "../../api/axios";
import DataTable from "../../components/common/DataTable";
import EditModal from "../../components/common/EditModal";
import hero from "../../styles/moduleHero.module.css";
import styles from "./UsersSettings.module.css";

const normalizeRoleName = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/\s+/g, "");

const prettify = (value) =>
  String(value || "")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();

const formatRoleName = (value) =>
  prettify(String(value || "").replace(/\s+/g, " "));

const UsersSettings = () => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [errorText, setErrorText] = useState("");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "",
  });
  const [editTarget, setEditTarget] = useState(null);
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "",
  });

  const fetchData = async () => {
    try {
      const [usersRes, rolesRes] = await Promise.all([
        API.get("/auth"),
        API.get("/roles"),
      ]);
      setUsers(usersRes.data.data || []);
      const rawRoles = rolesRes.data.data || [];
      const seen = new Set();
      const roleList = [...rawRoles]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .filter((role) => {
          const key = normalizeRoleName(role.name);
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
      setRoles(roleList);
      const roleExists = roleList.some((role) => role._id === form.role);
      if ((!form.role || !roleExists) && roleList.length > 0) {
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

  const roleOptions = useMemo(
    () => roles.map((role) => ({ value: role._id, label: formatRoleName(role.name) })),
    [roles]
  );

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const createUser = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await API.post("/auth/register", form);
      setForm((prev) => ({ ...prev, name: "", email: "", password: "" }));
      await fetchData();
    } catch (error) {
      setErrorText(error.response?.data?.message || "Failed to create user");
    } finally {
      setSaving(false);
    }
  };

  const selectedRole = roles.find((r) => r._id === form.role);

  const openEdit = (user) => {
    setEditTarget(user);
    setEditForm({
      name: user.name || "",
      email: user.email || "",
      password: "",
      role: user.role?._id || roleOptions[0]?.value || "",
    });
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const submitEdit = async () => {
    if (!editTarget?._id) return;
    try {
      setSaving(true);
      const payload = {
        name: editForm.name,
        email: editForm.email,
        role: editForm.role,
      };
      if (editForm.password.trim()) payload.password = editForm.password.trim();
      const { data } = await API.put(`/auth/${editTarget._id}`, payload);
      setUsers((prev) =>
        prev.map((user) => (user._id === editTarget._id ? data.data : user))
      );
      setEditTarget(null);
    } catch (error) {
      setErrorText(error.response?.data?.message || "Failed to update user");
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (user) => {
    try {
      const { data } = await API.patch(`/auth/${user._id}/status`, {
        isActive: !user.isActive,
      });
      setUsers((prev) =>
        prev.map((item) => (item._id === user._id ? data.data : item))
      );
    } catch (error) {
      setErrorText(error.response?.data?.message || "Failed to update user status");
    }
  };

  const removeUser = async (user) => {
    const ok = window.confirm(`Delete user "${user.name}"?`);
    if (!ok) return;
    try {
      await API.delete(`/auth/${user._id}`);
      setUsers((prev) => prev.filter((item) => item._id !== user._id));
    } catch (error) {
      setErrorText(error.response?.data?.message || "Failed to delete user");
    }
  };

  const columns = [
    { key: "name", label: "Name" },
    { key: "email", label: "Email" },
    {
      key: "role",
      label: "Role",
      render: (row) =>
        row.role?.name ? formatRoleName(row.role.name) : "Role Missing",
    },
    {
      key: "isActive",
      label: "Status",
      render: (row) => (row.isActive ? "Active" : "Inactive"),
    },
    {
      key: "actions",
      label: "Actions",
      render: (row) => (
        <div className={styles.actionRow}>
          <button type="button" onClick={() => openEdit(row)}>
            Edit
          </button>
          <button type="button" onClick={() => toggleStatus(row)}>
            {row.isActive ? "Inactivate" : "Activate"}
          </button>
          <button type="button" onClick={() => removeUser(row)}>
            Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className={hero.pageWrapper}>
      <div className={hero.hero}>
        <div>
          <p className={hero.kicker}>Access Control</p>
          <h1 className={hero.title}>User Settings</h1>
          <p className={hero.subtitle}>
            Create users, assign roles, and control user account status.
          </p>
        </div>
      </div>

      <div className={styles.container}>
        <form onSubmit={createUser} className={styles.form}>
          <label>
            <span>User Name</span>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Enter user name"
              required
            />
          </label>
          <label>
            <span>Email</span>
            <input
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="Enter email"
              required
            />
          </label>
          <label>
            <span>Password</span>
            <input
              name="password"
              value={form.password}
              onChange={handleChange}
              type="password"
              placeholder="Enter password"
              required
            />
          </label>
          <label>
            <span>Role</span>
            <select name="role" value={form.role} onChange={handleChange} required>
              {roles.map((role) => (
                <option key={role._id} value={role._id}>
                  {formatRoleName(role.name)}
                </option>
              ))}
            </select>
          </label>

          {selectedRole ? (
            <div className={styles.preview}>
              Access Preview:{" "}
              {Object.entries(selectedRole.permissions || {})
                .filter(([, actions]) => Object.values(actions || {}).some(Boolean))
                .map(([module]) => prettify(module))
                .join(", ")}
            </div>
          ) : null}

          <button type="submit" className={styles.primaryBtn} disabled={saving}>
            {saving ? "Saving..." : "Create User"}
          </button>
        </form>

        {errorText ? <p className={styles.error}>{errorText}</p> : null}

        <DataTable columns={columns} data={users} title="users-settings" />
      </div>

      <EditModal
        isOpen={Boolean(editTarget)}
        title="Edit User"
        fields={[
          { name: "name", label: "User Name", required: true },
          { name: "email", label: "Email", type: "email", required: true },
          {
            name: "role",
            label: "Role",
            type: "select",
            required: true,
            options: roleOptions,
          },
          {
            name: "password",
            label: "New Password (Optional)",
            type: "password",
            placeholder: "Leave blank to keep current password",
          },
        ]}
        values={editForm}
        onChange={handleEditChange}
        onClose={() => setEditTarget(null)}
        onSubmit={submitEdit}
        submitting={saving}
      />
    </div>
  );
};

export default UsersSettings;
