import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api/axios";
import styles from "../sales/AddSales.module.css";

const AddProductionPlan = () => {
  const navigate = useNavigate();
  const [salesOrders, setSalesOrders] = useState([]);
  const [form, setForm] = useState({
    planNumber: "",
    salesOrder: "",
    processType: "Dyeing",
    machineCode: "",
    shift: "General",
    planDate: "",
    requiredMaterialType: "RawYarn",
    requiredQuantity: "",
    plannedOutputMaterialType: "DyedYarn",
    plannedOutputQuantity: "",
    capacityHours: "",
    notes: "",
  });

  useEffect(() => {
    API.get("/sales-orders")
      .then((res) => setSalesOrders(res.data.data || []))
      .catch((error) => console.error(error));
  }, []);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await API.post("/production-plans", {
        ...form,
        salesOrder: form.salesOrder || undefined,
      });
      navigate("/production-plans");
    } catch (error) {
      alert(error.response?.data?.message || "Failed to create production plan");
    }
  };

  return (
    <div className={styles.container}>
      <h2>Add Production Plan</h2>
      <form onSubmit={handleSubmit} className={styles.form}>
        <input name="planNumber" placeholder="Plan Number" onChange={handleChange} required />
        <select name="salesOrder" value={form.salesOrder} onChange={handleChange}>
          <option value="">Select Sales Order (Optional)</option>
          {salesOrders.map((order) => (
            <option key={order._id} value={order._id}>
              {order.orderNumber}
            </option>
          ))}
        </select>
        <select name="processType" value={form.processType} onChange={handleChange}>
          <option value="Dyeing">Dyeing</option>
          <option value="Bleaching">Bleaching</option>
          <option value="Weaving">Weaving</option>
          <option value="Washing">Washing</option>
          <option value="Finishing">Finishing</option>
          <option value="Beam">Beam</option>
          <option value="Other">Other</option>
        </select>
        <input name="machineCode" placeholder="Machine Code" onChange={handleChange} required />
        <select name="shift" value={form.shift} onChange={handleChange}>
          <option value="General">General</option>
          <option value="A">Shift A</option>
          <option value="B">Shift B</option>
          <option value="C">Shift C</option>
        </select>
        <input name="planDate" type="date" onChange={handleChange} required />
        <select name="requiredMaterialType" value={form.requiredMaterialType} onChange={handleChange}>
          <option value="RawYarn">Raw Yarn</option>
          <option value="DyedYarn">Dyed Yarn</option>
          <option value="GreyFabric">Grey Fabric</option>
          <option value="FinishedFabric">Finished Fabric</option>
        </select>
        <input name="requiredQuantity" type="number" placeholder="Required Quantity" onChange={handleChange} required />
        <select
          name="plannedOutputMaterialType"
          value={form.plannedOutputMaterialType}
          onChange={handleChange}
        >
          <option value="DyedYarn">Dyed Yarn</option>
          <option value="GreyFabric">Grey Fabric</option>
          <option value="FinishedFabric">Finished Fabric</option>
        </select>
        <input
          name="plannedOutputQuantity"
          type="number"
          placeholder="Planned Output Quantity"
          onChange={handleChange}
          required
        />
        <input name="capacityHours" type="number" placeholder="Capacity Hours" onChange={handleChange} />
        <input name="notes" placeholder="Notes" onChange={handleChange} />
        <button type="submit" className={styles.button}>
          Save Plan
        </button>
      </form>
    </div>
  );
};

export default AddProductionPlan;
