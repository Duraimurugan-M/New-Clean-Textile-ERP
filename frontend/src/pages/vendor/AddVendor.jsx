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
        <input
          name="vendorName"
          placeholder="Vendor Name"
          onChange={handleChange}
          required
        />

        <input
          name="contactPerson"
          placeholder="Contact Person"
          onChange={handleChange}
        />

        <input
          name="phone"
          placeholder="Phone"
          onChange={handleChange}
        />

        <input
          type="email"
          name="email"
          placeholder="Email"
          onChange={handleChange}
        />

        <textarea
          name="address"
          placeholder="Address"
          onChange={handleChange}
        />

        <select name="jobType" onChange={handleChange}>
          <option value="Dyeing">Dyeing</option>
          <option value="Warping">Warping</option>
          <option value="Sizing">Sizing</option>
          <option value="Finishing">Finishing</option>
        </select>

        <select name="status" onChange={handleChange}>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>

        <button type="submit" className={styles.submitBtn}>
          Create Vendor
        </button>
      </form>
    </div>
  );
};

export default AddVendor;
