import { useState } from "react";
import { Link } from "react-router-dom";
import API from "../../api/axios";
import DataTable from "../../components/common/DataTable";
import EditModal from "../../components/common/EditModal";
import styles from "./SupplierList.module.css";
import hero from "../../styles/moduleHero.module.css";

const SupplierList = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [editTarget, setEditTarget] = useState(null);
  const [editForm, setEditForm] = useState({
    supplierName: "",
    contactPerson: "",
    phone: "",
    email: "",
    address: "",
  });
  const [savingEdit, setSavingEdit] = useState(false);

  const fetchSuppliers = async (params) => {
    try {
      const query = new URLSearchParams(params).toString();
      const { data } = await API.get(`/suppliers?${query}`);

      setSuppliers(data.data);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      console.error("Error fetching suppliers", error);
    }
  };

  const handleToggleStatus = async (row) => {
    try {
      await API.patch(`/suppliers/${row._id}/status`, { isActive: !row.isActive });
      setSuppliers((prev) =>
        prev.map((item) => (item._id === row._id ? { ...item, isActive: !row.isActive } : item))
      );
    } catch (error) {
      alert(error.response?.data?.message || "Failed to update supplier status");
    }
  };

  const handleEdit = async (row) => {
    setEditTarget(row);
    setEditForm({
      supplierName: row.supplierName || "",
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
      const { data } = await API.put(`/suppliers/${editTarget._id}`, editForm);
      const updated = data.data;
      setSuppliers((prev) => prev.map((item) => (item._id === editTarget._id ? updated : item)));
      setEditTarget(null);
    } catch (error) {
      alert(error.response?.data?.message || "Failed to update supplier");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDelete = async (row) => {
    const ok = window.confirm(`Delete supplier "${row.supplierName}"?`);
    if (!ok) return;
    try {
      await API.delete(`/suppliers/${row._id}`);
      setSuppliers((prev) => prev.filter((item) => item._id !== row._id));
    } catch (error) {
      alert(error.response?.data?.message || "Failed to delete supplier");
    }
  };

  const columns = [
    { key: "supplierName", label: "Supplier Name" },
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
    <div className={hero.pageWrapper}>
      <div className={hero.hero}>
        <p className={hero.kicker}>Purchase Workspace</p>
        <h1 className={hero.title}>Supplier Management</h1>
        <p className={hero.subtitle}>Maintain supplier master data for purchase and procurement operations.</p>
      </div>
      <div className={styles.container}>
        <div className={styles.header}>
          <h2>Supplier Directory</h2>
          <Link to="/supplier/add" className={styles.addBtn}>
            + Add Supplier
          </Link>
        </div>

        <DataTable
          columns={columns}
          data={suppliers}
          serverMode={true}
          totalPages={totalPages}
          onFetchData={fetchSuppliers}
          searchField="Supplier Name"
        />

        <EditModal
          isOpen={Boolean(editTarget)}
          title="Edit Supplier"
          fields={[
            { name: "supplierName", label: "Supplier Name", required: true },
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
    </div>
  );
};

export default SupplierList;
