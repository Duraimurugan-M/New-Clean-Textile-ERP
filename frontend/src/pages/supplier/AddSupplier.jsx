import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api/axios";
import styles from "./AddSupplier.module.css";

const AddSupplier = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    supplierName: "",
    contactPerson: "",
    phone: "",
    email: "",
    address: "",
  });

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await API.post("/suppliers", form);
      navigate("/supplier");
    } catch (error) {
      console.error(error.response?.data || error.message);
      alert("Failed to create supplier");
    }
  };

  return (
    <div className={styles.container}>
      <h2>Add Supplier</h2>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div style={{ display: "grid", gap: 6 }}>
          <label>Supplier Name</label>
          <input
            name="supplierName"
            placeholder="Supplier Name"
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
            required
          />
        </div>

        <div style={{ display: "grid", gap: 6 }}>
          <label>Phone</label>
          <input
            name="phone"
            placeholder="Phone"
            onChange={handleChange}
            required
          />
        </div>

        <div style={{ display: "grid", gap: 6 }}>
          <label>Email</label>
          <input
            name="email"
            type="email"
            placeholder="Email"
            onChange={handleChange}
            required
          />
        </div>

        <div style={{ display: "grid", gap: 6 }}>
          <label>Address</label>
          <input
            name="address"
            placeholder="Address"
            onChange={handleChange}
            required
          />
        </div>

        <button type="submit">Create Supplier</button>
      </form>
    </div>
  );
};

export default AddSupplier;
