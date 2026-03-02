import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api/axios";
import styles from "../sales/AddSales.module.css";

const AddDispatch = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [lots, setLots] = useState([]);
  const [form, setForm] = useState({
    dispatchNumber: "",
    salesOrder: "",
    customer: "",
    materialType: "FinishedFabric",
    lotNumber: "",
    quantity: "",
    unit: "meter",
    packingListNo: "",
    transportName: "",
    vehicleNumber: "",
    ewayBillNumber: "",
    expectedDeliveryDate: "",
    notes: "",
  });

  useEffect(() => {
    const load = async () => {
      const [custRes, orderRes, invRes] = await Promise.all([
        API.get("/customers?activeOnly=true&limit=1000"),
        API.get("/sales-orders"),
        API.get("/inventory?limit=1000"),
      ]);
      setCustomers(custRes.data.data || []);
      setOrders(orderRes.data.data || []);
      setLots(
        (invRes.data.data || []).filter(
          (item) => item.materialType === "FinishedFabric" && item.quantity > 0
        )
      );
    };
    load().catch((error) => console.error(error));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await API.post("/dispatch", {
        ...form,
        salesOrder: form.salesOrder || undefined,
      });
      navigate("/dispatch");
    } catch (error) {
      alert(error.response?.data?.message || "Failed to create dispatch");
    }
  };

  return (
    <div className={styles.container}>
      <h2>Create Dispatch</h2>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div style={{ display: "grid", gap: 6 }}>
          <label>Dispatch Number</label>
          <input
            name="dispatchNumber"
            placeholder="Dispatch Number"
            value={form.dispatchNumber}
            onChange={handleChange}
            required
          />
        </div>
        <div style={{ display: "grid", gap: 6 }}>
          <label>Sales Order</label>
          <select name="salesOrder" value={form.salesOrder} onChange={handleChange}>
            <option value="">Select Sales Order (Optional)</option>
            {orders.map((order) => (
              <option key={order._id} value={order._id}>
                {order.orderNumber} - {order.status}
              </option>
            ))}
          </select>
        </div>
        <div style={{ display: "grid", gap: 6 }}>
          <label>Customer</label>
          <select name="customer" value={form.customer} onChange={handleChange} required>
            <option value="">Select Customer</option>
            {customers.map((cust) => (
              <option key={cust._id} value={cust._id}>
                {cust.customerName}
              </option>
            ))}
          </select>
        </div>
        <div style={{ display: "grid", gap: 6 }}>
          <label>Lot Number</label>
          <select name="lotNumber" value={form.lotNumber} onChange={handleChange} required>
            <option value="">Select Lot</option>
            {lots.map((lot) => (
              <option key={lot._id} value={lot.lotNumber}>
                {lot.lotNumber} (Available: {lot.quantity})
              </option>
            ))}
          </select>
        </div>
        <div style={{ display: "grid", gap: 6 }}>
          <label>Dispatch Quantity</label>
          <input
            name="quantity"
            type="number"
            placeholder="Dispatch Quantity"
            value={form.quantity}
            onChange={handleChange}
            required
          />
        </div>
        <div style={{ display: "grid", gap: 6 }}>
          <label>Packing List No</label>
          <input name="packingListNo" placeholder="Packing List No" onChange={handleChange} />
        </div>
        <div style={{ display: "grid", gap: 6 }}>
          <label>Transport Name</label>
          <input name="transportName" placeholder="Transport Name" onChange={handleChange} />
        </div>
        <div style={{ display: "grid", gap: 6 }}>
          <label>Vehicle Number</label>
          <input name="vehicleNumber" placeholder="Vehicle Number" onChange={handleChange} />
        </div>
        <div style={{ display: "grid", gap: 6 }}>
          <label>E-way Bill Number</label>
          <input name="ewayBillNumber" placeholder="E-way Bill Number" onChange={handleChange} />
        </div>
        <div style={{ display: "grid", gap: 6 }}>
          <label>Expected Delivery Date</label>
          <input
            name="expectedDeliveryDate"
            type="date"
            value={form.expectedDeliveryDate}
            onChange={handleChange}
          />
        </div>
        <div style={{ display: "grid", gap: 6 }}>
          <label>Notes</label>
          <input name="notes" placeholder="Notes" onChange={handleChange} />
        </div>
        <button type="submit" className={styles.button}>
          Save Dispatch
        </button>
      </form>
    </div>
  );
};

export default AddDispatch;
