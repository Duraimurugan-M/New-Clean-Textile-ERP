import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api/axios";
import styles from "./Vendor.module.css";

const AddVendor = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    vendorName: "",
    contactPerson: "",
    phone: "",
    email: "",
    address: "",
    jobType: "Dyeing",
    status: "Active",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await API.post("/vendors", form);
      navigate("/vendors");
    } catch (error) {
      alert(error.response?.data?.message || "Failed to create vendor");
    }
  };

  return (
    <div className={`${styles.container} ${styles.formPage}`}>
      <h2>Add Vendor</h2>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div style={{ display: "grid", gap: 6 }}>
          <label>Vendor Name</label>
          <input
            name="vendorName"
            placeholder="Vendor Name"
            onChange={handleChange}
            required
          />
        </div>

        <div style={{ display: "grid", gap: 6 }}>
          <label>Contact Person</label>
          <input
            name="contactPerson"
            placeholder="Contact Person"
            onChange={handleChange}
          />
        </div>

        <div style={{ display: "grid", gap: 6 }}>
          <label>Phone</label>
          <input
            name="phone"
            placeholder="Phone"
            onChange={handleChange}
          />
        </div>

        <div style={{ display: "grid", gap: 6 }}>
          <label>Email</label>
          <input
            type="email"
            name="email"
            placeholder="Email"
            onChange={handleChange}
          />
        </div>

        <div style={{ display: "grid", gap: 6 }}>
          <label>Address</label>
          <textarea
            name="address"
            placeholder="Address"
            onChange={handleChange}
          />
        </div>

        <div style={{ display: "grid", gap: 6 }}>
          <label>Job Type</label>
          <select name="jobType" onChange={handleChange}>
            <option value="Dyeing">Dyeing</option>
            <option value="Warping">Warping</option>
            <option value="Sizing">Sizing</option>
            <option value="Finishing">Finishing</option>
          </select>
        </div>

        <div style={{ display: "grid", gap: 6 }}>
          <label>Status</label>
          <select name="status" onChange={handleChange}>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>

        <button type="submit" className={styles.submitBtn}>
          Create Vendor
        </button>
      </form>
    </div>
  );
};

export default AddVendor;
