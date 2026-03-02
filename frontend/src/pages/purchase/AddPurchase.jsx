import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api/axios";
import styles from "./AddPurchase.module.css";

const AddPurchase = () => {
  const navigate = useNavigate();

  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);

const [formData, setFormData] = useState({
  supplier: "",
  materialType: "RawYarn",
  lotNumber: "",
  quantity: "",
  unit: "kg",
  ratePerUnit: "",
});

  // 🔹 Fetch Suppliers on Load
  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      const { data } = await API.get("/suppliers?activeOnly=true&limit=1000");
      setSuppliers(data.data);
    } catch (error) {
      console.error("Error fetching suppliers", error);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      await API.post("/purchase", formData);

      alert("Purchase created successfully");
      navigate("/purchase");
    } catch (error) {
      console.error(error.response?.data || error.message);
      alert(error.response?.data?.message || "Failed to create purchase");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Add Purchase</h2>

      <form className={styles.form} onSubmit={handleSubmit}>
        {/* Supplier Dropdown */}
        <div className={styles.formGroup}>
          <label>Supplier</label>
          <select
            name="supplier"
            value={formData.supplier}
            onChange={handleChange}
            required
          >
            <option value="">Select Supplier</option>
            {suppliers.map((sup) => (
              <option key={sup._id} value={sup._id}>
                {sup.supplierName}
              </option>
            ))}
          </select>
        </div>

            {/* Material Type */}
        <div className={styles.formGroup}>
          <label>Material Type</label>
          <select
            name="materialType"
            value={formData.materialType}
            onChange={handleChange}
            required
          >
            <option value="RawYarn">Raw Yarn</option>
            <option value="DyedYarn">Dyed Yarn</option>
            <option value="GreyFabric">Grey Fabric</option>
            <option value="FinishedFabric">Finished Fabric</option>
          </select>
        </div>

        {/* Lot Number */}
        <div className={styles.formGroup}>
          <label>Lot Number</label>
          <input
            type="text"
            name="lotNumber"
            value={formData.lotNumber}
            onChange={handleChange}
            required
          />
        </div>

        {/* Quantity + Unit + Rate */}
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label>Quantity</label>
            <input
              type="number"
              name="quantity"
              value={formData.quantity}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label>Unit</label>
            <select name="unit" value={formData.unit} onChange={handleChange}>
              <option value="kg">kg</option>
              <option value="meter">meter</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label>Rate Per Unit</label>
            <input
              type="number"
              name="ratePerUnit"
              value={formData.ratePerUnit}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <button className={styles.button} type="submit" disabled={loading}>
          {loading ? "Saving..." : "Create Purchase"}
        </button>
      </form>
    </div>
  );
};

export default AddPurchase;
