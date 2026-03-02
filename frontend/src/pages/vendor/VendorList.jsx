import { useState } from "react";
import { Link } from "react-router-dom";
import API from "../../api/axios";
import DataTable from "../../components/common/DataTable";
import EditModal from "../../components/common/EditModal";
import styles from "./Vendor.module.css";
import hero from "../../styles/moduleHero.module.css";

const VendorList = () => {
  const [vendors, setVendors] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [editTarget, setEditTarget] = useState(null);
  const [editForm, setEditForm] = useState({
    vendorName: "",
    contactPerson: "",
    phone: "",
    email: "",
    address: "",
    jobType: "Dyeing",
  });
  const [savingEdit, setSavingEdit] = useState(false);

  const fetchVendors = async (params) => {
    try {
      const query = new URLSearchParams(params).toString();
      const { data } = await API.get(`/vendors?${query}`);

      setVendors(data.data);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      console.error("Error fetching vendors", error);
    }
  };

  const handleToggleStatus = async (row) => {
    try {
      const nextStatus = row.status === "Active" ? "Inactive" : "Active";
      await API.patch(`/vendors/${row._id}/status`, { status: nextStatus });
      setVendors((prev) =>
        prev.map((item) => (item._id === row._id ? { ...item, status: nextStatus } : item))
      );
    } catch (error) {
      alert(error.response?.data?.message || "Failed to update vendor status");
    }
  };

  const handleEdit = async (row) => {
    setEditTarget(row);
    setEditForm({
      vendorName: row.vendorName || "",
      contactPerson: row.contactPerson || "",
      phone: row.phone || "",
      email: row.email || "",
      address: row.address || "",
      jobType: row.jobType || "Dyeing",
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
      const { data } = await API.put(`/vendors/${editTarget._id}`, editForm);
      const updated = data.data;
      setVendors((prev) => prev.map((item) => (item._id === editTarget._id ? updated : item)));
      setEditTarget(null);
    } catch (error) {
      alert(error.response?.data?.message || "Failed to update vendor");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDelete = async (row) => {
    const ok = window.confirm(`Delete vendor "${row.vendorName}"?`);
    if (!ok) return;
    try {
      await API.delete(`/vendors/${row._id}`);
      setVendors((prev) => prev.filter((item) => item._id !== row._id));
    } catch (error) {
      alert(error.response?.data?.message || "Failed to delete vendor");
    }
  };

  const columns = [
    { key: "vendorName", label: "Vendor Name" },
    { key: "contactPerson", label: "Contact Person" },
    { key: "phone", label: "Phone" },
    { key: "email", label: "Email" },
    { key: "jobType", label: "Job Type" },
    {
      key: "status",
      label: "Status",
      render: (row) => (
        <span
          className={`${styles.badge} ${
            row.status === "Active" ? styles.active : styles.inactive
          }`}
        >
          {row.status}
        </span>
      ),
    },
    {
      key: "actions",
      label: "Action",
      render: (row) => (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <button type="button" onClick={() => handleEdit(row)}>Edit</button>
          <button type="button" onClick={() => handleToggleStatus(row)}>
            {row.status === "Active" ? "Inactivate" : "Activate"}
          </button>
          <button type="button" onClick={() => handleDelete(row)}>Delete</button>
        </div>
      ),
    },
  ];

  return (
    <div className={hero.pageWrapper}>
      <div className={hero.hero}>
        <p className={hero.kicker}>Job Work Workspace</p>
        <h1 className={hero.title}>Vendor Management</h1>
        <p className={hero.subtitle}>Manage job worker vendor profile, status, and process capabilities.</p>
      </div>
      <div className={styles.container}>
        <div className={styles.header}>
          <h2>Vendor Directory</h2>
          <Link to="/vendors/add" className={styles.addBtn}>
            + Add Vendor
          </Link>
        </div>

        <DataTable
          columns={columns}
          data={vendors}
          serverMode={true}
          totalPages={totalPages}
          onFetchData={fetchVendors}
          searchField="Vendor Name"
        />

        <EditModal
          isOpen={Boolean(editTarget)}
          title="Edit Vendor"
          fields={[
            { name: "vendorName", label: "Vendor Name", required: true },
            { name: "contactPerson", label: "Contact Person" },
            { name: "phone", label: "Phone" },
            { name: "email", label: "Email", type: "email" },
            { name: "address", label: "Address" },
            {
              name: "jobType",
              label: "Job Type",
              type: "select",
              options: [
                { label: "Dyeing", value: "Dyeing" },
                { label: "Warping", value: "Warping" },
                { label: "Sizing", value: "Sizing" },
                { label: "Finishing", value: "Finishing" },
              ],
            },
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

export default VendorList;
