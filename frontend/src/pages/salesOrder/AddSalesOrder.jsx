import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api/axios";
import styles from "../sales/AddSales.module.css";

const AddSalesOrder = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [form, setForm] = useState({
    orderNumber: "",
    customer: "",
    deliveryDate: "",
    notes: "",
    itemMaterialType: "FinishedFabric",
    itemQuantity: "",
    itemUnit: "meter",
    itemRatePerUnit: "",
  });

  useEffect(() => {
    const loadCustomers = async () => {
      const { data } = await API.get("/customers");
      setCustomers(data.data || []);
    };
    loadCustomers();
  }, []);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        orderNumber: form.orderNumber,
        customer: form.customer,
        deliveryDate: form.deliveryDate,
        notes: form.notes,
        status: "Confirmed",
        items: [
          {
            materialType: form.itemMaterialType,
            quantity: Number(form.itemQuantity),
            unit: form.itemUnit,
            ratePerUnit: Number(form.itemRatePerUnit),
          },
        ],
      };
      await API.post("/sales-orders", payload);
      navigate("/sales-orders");
    } catch (error) {
      alert(error.response?.data?.message || "Failed to create sales order");
    }
  };

  return (
    <div className={styles.container}>
      <h2>Create Sales Order</h2>
      <form onSubmit={handleSubmit} className={styles.form}>
        <input
          name="orderNumber"
          placeholder="Order Number"
          value={form.orderNumber}
          onChange={handleChange}
          required
        />
        <select name="customer" value={form.customer} onChange={handleChange} required>
          <option value="">Select Customer</option>
          {customers.map((cust) => (
            <option key={cust._id} value={cust._id}>
              {cust.customerName}
            </option>
          ))}
        </select>
        <input
          name="deliveryDate"
          type="date"
          value={form.deliveryDate}
          onChange={handleChange}
          required
        />
        <select name="itemMaterialType" value={form.itemMaterialType} onChange={handleChange}>
          <option value="FinishedFabric">Finished Fabric</option>
          <option value="GreyFabric">Grey Fabric</option>
          <option value="DyedYarn">Dyed Yarn</option>
          <option value="RawYarn">Raw Yarn</option>
        </select>
        <input
          name="itemQuantity"
          type="number"
          placeholder="Quantity"
          value={form.itemQuantity}
          onChange={handleChange}
          required
        />
        <select name="itemUnit" value={form.itemUnit} onChange={handleChange}>
          <option value="meter">meter</option>
          <option value="kg">kg</option>
        </select>
        <input
          name="itemRatePerUnit"
          type="number"
          placeholder="Rate Per Unit"
          value={form.itemRatePerUnit}
          onChange={handleChange}
          required
        />
        <input name="notes" placeholder="Notes" value={form.notes} onChange={handleChange} />
        <button type="submit" className={styles.button}>
          Save Order
        </button>
      </form>
    </div>
  );
};

export default AddSalesOrder;
