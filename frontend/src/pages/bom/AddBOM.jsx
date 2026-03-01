import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api/axios";
import styles from "../sales/AddSales.module.css";

const createEmptyItem = () => ({
  materialType: "RawYarn",
  materialName: "",
  quantity: "",
  unit: "kg",
  wastagePercentage: "",
  processStage: "",
});

const AddBOM = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    bomCode: "",
    productName: "",
    productCode: "",
    outputMaterialType: "FinishedFabric",
    outputQuantityPerBatch: "",
    version: 1,
    status: "Active",
    effectiveFrom: "",
    effectiveTo: "",
    notes: "",
  });
  const [items, setItems] = useState([createEmptyItem()]);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleItemChange = (index, field, value) => {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const addItem = () => setItems((prev) => [...prev, createEmptyItem()]);
  const removeItem = (index) => {
    setItems((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== index)));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await API.post("/bom", {
        ...formData,
        version: Number(formData.version),
        outputQuantityPerBatch: Number(formData.outputQuantityPerBatch),
        items: items.map((item) => ({
          ...item,
          quantity: Number(item.quantity),
          wastagePercentage: Number(item.wastagePercentage || 0),
        })),
      });
      navigate("/bom");
    } catch (error) {
      alert(error.response?.data?.message || "Failed to create BOM");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <h2>Add BOM</h2>
      <form className={styles.form} onSubmit={handleSubmit}>
        <div style={{ display: "grid", gap: 6 }}>
          <label>BOM Code</label>
          <input name="bomCode" placeholder="BOM Code" value={formData.bomCode} onChange={handleChange} required />
        </div>
        <div style={{ display: "grid", gap: 6 }}>
          <label>Product Name</label>
          <input
            name="productName"
            placeholder="Product Name"
            value={formData.productName}
            onChange={handleChange}
            required
          />
        </div>
        <div style={{ display: "grid", gap: 6 }}>
          <label>Product Code</label>
          <input
            name="productCode"
            placeholder="Product Code (Optional)"
            value={formData.productCode}
            onChange={handleChange}
          />
        </div>
        <div style={{ display: "grid", gap: 6 }}>
          <label>Output Material Type</label>
          <select
            name="outputMaterialType"
            value={formData.outputMaterialType}
            onChange={handleChange}
            required
          >
            <option value="RawYarn">Raw Yarn</option>
            <option value="DyedYarn">Dyed Yarn</option>
            <option value="GreyFabric">Grey Fabric</option>
            <option value="FinishedFabric">Finished Fabric</option>
          </select>
        </div>
        <div style={{ display: "grid", gap: 6 }}>
          <label>Output Quantity Per Batch</label>
          <input
            type="number"
            step="0.0001"
            min="0.0001"
            name="outputQuantityPerBatch"
            placeholder="Output Quantity Per Batch"
            value={formData.outputQuantityPerBatch}
            onChange={handleChange}
            required
          />
        </div>
        <div style={{ display: "grid", gap: 6 }}>
          <label>Version</label>
          <input
            type="number"
            min="1"
            name="version"
            placeholder="Version"
            value={formData.version}
            onChange={handleChange}
            required
          />
        </div>
        <div style={{ display: "grid", gap: 6 }}>
          <label>Status</label>
          <select name="status" value={formData.status} onChange={handleChange}>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
        <div style={{ display: "grid", gap: 6 }}>
          <label>Effective From</label>
          <input
            type="date"
            name="effectiveFrom"
            value={formData.effectiveFrom}
            onChange={handleChange}
            required
          />
        </div>
        <div style={{ display: "grid", gap: 6 }}>
          <label>Effective To</label>
          <input type="date" name="effectiveTo" value={formData.effectiveTo} onChange={handleChange} />
        </div>
        <div style={{ display: "grid", gap: 6 }}>
          <label>Notes</label>
          <input name="notes" placeholder="Notes" value={formData.notes} onChange={handleChange} />
        </div>

        <div style={{ gridColumn: "1 / -1", marginTop: 4 }}>
          <h3 style={{ margin: "0 0 10px 0" }}>BOM Items</h3>
          <div style={{ display: "grid", gap: 10 }}>
            {items.map((item, index) => (
              <div
                key={`item-${index}`}
                style={{
                  border: "1px solid var(--border-subtle)",
                  borderRadius: 12,
                  padding: 10,
                  display: "grid",
                  gap: 8,
                }}
              >
                <div style={{ display: "grid", gap: 8, gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}>
                  <div style={{ display: "grid", gap: 6 }}>
                    <label>Material Type</label>
                    <select
                      value={item.materialType}
                      onChange={(e) => handleItemChange(index, "materialType", e.target.value)}
                      required
                    >
                      <option value="RawYarn">Raw Yarn</option>
                      <option value="DyedYarn">Dyed Yarn</option>
                      <option value="GreyFabric">Grey Fabric</option>
                      <option value="FinishedFabric">Finished Fabric</option>
                      <option value="Chemical">Chemical</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div style={{ display: "grid", gap: 6 }}>
                    <label>Material Name</label>
                    <input
                      placeholder="Material Name"
                      value={item.materialName}
                      onChange={(e) => handleItemChange(index, "materialName", e.target.value)}
                      required
                    />
                  </div>
                  <div style={{ display: "grid", gap: 6 }}>
                    <label>Quantity</label>
                    <input
                      type="number"
                      step="0.0001"
                      min="0.0001"
                      placeholder="Quantity"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, "quantity", e.target.value)}
                      required
                    />
                  </div>
                  <div style={{ display: "grid", gap: 6 }}>
                    <label>Unit</label>
                    <input
                      placeholder="Unit"
                      value={item.unit}
                      onChange={(e) => handleItemChange(index, "unit", e.target.value)}
                      required
                    />
                  </div>
                  <div style={{ display: "grid", gap: 6 }}>
                    <label>Wastage %</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      placeholder="Wastage %"
                      value={item.wastagePercentage}
                      onChange={(e) => handleItemChange(index, "wastagePercentage", e.target.value)}
                    />
                  </div>
                  <div style={{ display: "grid", gap: 6 }}>
                    <label>Process Stage</label>
                    <input
                      placeholder="Process Stage"
                      value={item.processStage}
                      onChange={(e) => handleItemChange(index, "processStage", e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <button type="button" className={styles.button} onClick={() => removeItem(index)}>
                    Remove Item
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 10 }}>
            <button type="button" className={styles.button} onClick={addItem}>
              + Add Item
            </button>
          </div>
        </div>

        <button type="submit" className={styles.button} disabled={loading}>
          {loading ? "Saving..." : "Create BOM"}
        </button>
      </form>
    </div>
  );
};

export default AddBOM;
