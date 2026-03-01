import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api/axios";
import styles from "./AddSales.module.css";

const AddSales = () => {
  const navigate = useNavigate();

  const [customers, setCustomers] = useState([]);
  const [lots, setLots] = useState([]);
  const [availableQty, setAvailableQty] = useState(0);

  const [form, setForm] = useState({
    customer: "",
    materialType: "FinishedFabric",
    lotNumber: "",
    quantity: "",
    ratePerUnit: "",
  });

  // ✅ Load Customers
  useEffect(() => {
    const loadCustomers = async () => {
      const { data } = await API.get("/customers");
      setCustomers(data.data);
    };
    loadCustomers();
  }, []);

  // ✅ Load Only QC Approved FinishedFabric Lots
  useEffect(() => {
    const loadLots = async () => {
      try {
        const qcRes = await API.get("/qc");
        const inventoryRes = await API.get("/inventory");

        // Get Approved QC lots
        const approvedLots = qcRes.data.data.filter(
          (qc) => qc.status === "Approved"
        );

        // Match with inventory & quantity > 0
        const validLots = inventoryRes.data.data.filter(
          (inv) =>
            inv.materialType === "FinishedFabric" &&
            inv.quantity > 0 &&
            approvedLots.some((qc) => qc.lotNumber === inv.lotNumber)
        );

        setLots(validLots);
      } catch (error) {
        console.error(error);
      }
    };

    loadLots();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "lotNumber") {
      const selectedLot = lots.find((lot) => lot.lotNumber === value);
      setAvailableQty(selectedLot ? selectedLot.quantity : 0);
    }

    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (Number(form.quantity) <= 0) {
      alert("Quantity must be greater than 0");
      return;
    }

    if (Number(form.quantity) > availableQty) {
      alert("Quantity exceeds available stock!");
      return;
    }

    try {
      await API.post("/sales", form);
      navigate("/sales");
    } catch (error) {
      alert(error.response?.data?.message || "Failed to create sale");
    }
  };

  const total =
    form.quantity && form.ratePerUnit
      ? Number(form.quantity) * Number(form.ratePerUnit)
      : 0;

  return (
    <div className={styles.container}>
      <h2>Add Sale</h2>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div style={{ display: "grid", gap: 6 }}>
          <label>Customer</label>
          <select
            name="customer"
            value={form.customer}
            onChange={handleChange}
            required
          >
            <option value="">Select Customer</option>
            {customers.map((cust) => (
              <option key={cust._id} value={cust._id}>
                {cust.customerName}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: "grid", gap: 6 }}>
          <label>Material Type</label>
          <input type="text" value="FinishedFabric" disabled />
        </div>

        <div style={{ display: "grid", gap: 6 }}>
          <label>Lot Number</label>
          <select
            name="lotNumber"
            value={form.lotNumber}
            onChange={handleChange}
            required
          >
            <option value="">Select Approved Lot</option>
            {lots.map((lot) => (
              <option key={lot._id} value={lot.lotNumber}>
                {lot.lotNumber} (Available: {lot.quantity})
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: "grid", gap: 6 }}>
          <label>Quantity</label>
          <input
            type="number"
            name="quantity"
            placeholder={`Available: ${availableQty}`}
            value={form.quantity}
            onChange={handleChange}
            required
          />
        </div>

        <div style={{ display: "grid", gap: 6 }}>
          <label>Rate Per Unit</label>
          <input
            type="number"
            name="ratePerUnit"
            placeholder="Rate Per Unit"
            value={form.ratePerUnit}
            onChange={handleChange}
            required
          />
        </div>

        <div style={{ fontWeight: "bold", fontSize: "15px" }}>
          Total: ₹{total}
        </div>

        <button type="submit" className={styles.button}>
          Create Sale
        </button>
      </form>
    </div>
  );
};

export default AddSales;
