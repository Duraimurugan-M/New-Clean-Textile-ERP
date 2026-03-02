import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api/axios";
import DataTable from "../../components/common/DataTable";
import EditModal from "../../components/common/EditModal";
import styles from "./CustomerList.module.css";

const CustomerList = () => {
  const [customers, setCustomers] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [editTarget, setEditTarget] = useState(null);
  const [editForm, setEditForm] = useState({
    customerName: "",
    contactPerson: "",
    phone: "",
    email: "",
    address: "",
  });
  const [savingEdit, setSavingEdit] = useState(false);
  const navigate = useNavigate();

  const fetchCustomers = async (params) => {
    try {
      const query = new URLSearchParams(params).toString();
      const { data } = await API.get(`/customers?${query}`);

      setCustomers(data.data);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      console.error("Error fetching customers", error);
    }
  };

  const handleToggleStatus = async (row) => {
    try {
      await API.patch(`/customers/${row._id}/status`, { isActive: !row.isActive });
      setCustomers((prev) =>
        prev.map((item) => (item._id === row._id ? { ...item, isActive: !row.isActive } : item))
      );
    } catch (error) {
      alert(error.response?.data?.message || "Failed to update customer status");
    }
  };

  const handleEdit = async (row) => {
    setEditTarget(row);
    setEditForm({
      customerName: row.customerName || "",
      contactPerson: row.contactPerson || "",
      phone: row.phone || "",
      email: row.email || "",
      address: row.address || "",
    });
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditSubmit = async () => {
    if (!editTarget) return;
    try {
      setSavingEdit(true);
      const { data } = await API.put(`/customers/${editTarget._id}`, editForm);
      const updated = data.data;
      setCustomers((prev) => prev.map((item) => (item._id === editTarget._id ? updated : item)));
      setEditTarget(null);
    } catch (error) {
      alert(error.response?.data?.message || "Failed to update customer");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDelete = async (row) => {
    const ok = window.confirm(`Delete customer "${row.customerName}"?`);
    if (!ok) return;
    try {
      await API.delete(`/customers/${row._id}`);
      setCustomers((prev) => prev.filter((item) => item._id !== row._id));
    } catch (error) {
      alert(error.response?.data?.message || "Failed to delete customer");
    }
  };

  const columns = [
    { key: "customerName", label: "Customer Name" },
    { key: "contactPerson", label: "Contact Person" },
    { key: "phone", label: "Phone" },
    { key: "email", label: "Email" },
    { key: "address", label: "Address" },
    {
      key: "isActive",
      label: "Status",
      render: (row) => (row.isActive ? "Active" : "Inactive"),
    },
    {
      key: "actions",
      label: "Action",
      render: (row) => (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <button type="button" onClick={() => handleEdit(row)}>Edit</button>
          <button type="button" onClick={() => handleToggleStatus(row)}>
            {row.isActive ? "Inactivate" : "Activate"}
          </button>
          <button type="button" onClick={() => handleDelete(row)}>Delete</button>
        </div>
      ),
    },
  ];

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.hero}>
        <div>
          <p className={styles.kicker}>Sales Foundation</p>
          <h1 className={styles.title}>Customer Management</h1>
          <p className={styles.subtitle}>Manage customer profiles for order flow, dispatch commitment, and billing.</p>
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.header}>
          <h2>Customer Directory</h2>
          <button
            className={styles.addBtn}
            onClick={() => navigate("/customer/add")}
          >
            + Add Customer
          </button>
        </div>

        <DataTable
          columns={columns}
          data={customers}
          serverMode={true}
          totalPages={totalPages}
          onFetchData={fetchCustomers}
          searchField="customerName"
        />
      </div>

      <EditModal
        isOpen={Boolean(editTarget)}
        title="Edit Customer"
        fields={[
          { name: "customerName", label: "Customer Name", required: true },
          { name: "contactPerson", label: "Contact Person" },
          { name: "phone", label: "Phone" },
          { name: "email", label: "Email", type: "email" },
          { name: "address", label: "Address" },
        ]}
        values={editForm}
        onChange={handleEditChange}
        onClose={() => setEditTarget(null)}
        onSubmit={handleEditSubmit}
        submitting={savingEdit}
      />
    </div>
  );
};

export default CustomerList;
