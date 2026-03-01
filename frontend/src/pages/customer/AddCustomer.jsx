import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api/axios";
import styles from "./AddCustomer.module.css";

const AddCustomer = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    customerName: "",
    contactPerson: "",
    phone: "",
    email: "",
    address: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await API.post("/customers", form);
      navigate("/customer");
    } catch (error) {
      console.error("Customer creation failed", error);
    }
  };

  return (
    <div className={styles.container}>
      <h2>Add Customer</h2>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div style={{ display: "grid", gap: 6 }}>
          <label>Customer Name</label>
          <input
            name="customerName"
            placeholder="Customer Name"
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
            placeholder="Email"
            onChange={handleChange}
            required
          />
        </div>

        <div style={{ display: "grid", gap: 6 }}>
          <label>Address</label>
          <textarea
            name="address"
            placeholder="Address"
            onChange={handleChange}
            required
          />
        </div>

        <button type="submit">Save Customer</button>
      </form>
    </div>
  );
};

export default AddCustomer;
