import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api/axios";
import styles from "./JobWork.module.css";

const MATERIAL_TYPES = ["RawYarn", "DyedYarn", "GreyFabric", "FinishedFabric"];
const PROCESS_TYPES = ["Dyeing", "Warping", "Sizing", "Finishing"];

const AddJobWork = () => {
  const navigate = useNavigate();

  const [vendors, setVendors] = useState([]);
  const [inventoryLots, setInventoryLots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingLots, setLoadingLots] = useState(false);

  const [formData, setFormData] = useState({
    vendor: "",
    processType: "Dyeing",
    materialType: "RawYarn",
    lotNumber: "",
    issueQuantity: "",
    expectedReturnDate: "",
    notes: "",
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const { data } = await API.get("/vendors");
        setVendors((data.data || []).filter((vendor) => vendor.status !== "Inactive"));
      } catch (error) {
        console.error("Failed to fetch vendors", error);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    const fetchLots = async () => {
      try {
        setLoadingLots(true);
        const query = new URLSearchParams({
          materialType: formData.materialType,
          status: "Available",
          limit: "200",
          sortBy: "createdAt",
          order: "desc",
        }).toString();

        const { data } = await API.get(`/inventory?${query}`);
        setInventoryLots(data.data || []);
      } catch (error) {
        console.error("Failed to fetch inventory lots", error);
        setInventoryLots([]);
      } finally {
        setLoadingLots(false);
      }
    };

    fetchLots();
  }, [formData.materialType]);

  const availableLots = useMemo(
    () => inventoryLots.filter((item) => item.quantity > 0),
    [inventoryLots]
  );

  const selectedLot = useMemo(
    () => availableLots.find((item) => item.lotNumber === formData.lotNumber),
    [availableLots, formData.lotNumber]
  );

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "materialType" ? { lotNumber: "" } : {}),
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const qty = Number(formData.issueQuantity);
    if (Number.isNaN(qty) || qty <= 0) {
      alert("Issue quantity should be greater than 0");
      return;
    }

    if (selectedLot && qty > selectedLot.quantity) {
      alert(`Issue quantity cannot exceed available stock (${selectedLot.quantity})`);
      return;
    }

    try {
      setLoading(true);
      await API.post("/job-work/issue", {
        ...formData,
        issueQuantity: qty,
      });

      alert("Job work issue created successfully");
      navigate("/job-work");
    } catch (error) {
      alert(error?.response?.data?.message || "Failed to create job work issue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`${styles.container} ${styles.formPage}`}>
      <h2>Issue Job Work</h2>

      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.formGroup}>
          <label>Vendor</label>
          <select
            name="vendor"
            value={formData.vendor}
            onChange={handleChange}
            required
          >
            <option value="">Select vendor</option>
            {vendors.map((vendor) => (
              <option key={vendor._id} value={vendor._id}>
                {vendor.vendorName} ({vendor.jobType})
              </option>
            ))}
          </select>
        </div>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label>Process Type</label>
            <select
              name="processType"
              value={formData.processType}
              onChange={handleChange}
              required
            >
              {PROCESS_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label>Material Type</label>
            <select
              name="materialType"
              value={formData.materialType}
              onChange={handleChange}
              required
            >
              {MATERIAL_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label>Lot Number</label>
            <select
              name="lotNumber"
              value={formData.lotNumber}
              onChange={handleChange}
              required
              disabled={loadingLots}
            >
              <option value="">{loadingLots ? "Loading lots..." : "Select lot"}</option>
              {availableLots.map((lot) => (
                <option key={lot._id} value={lot.lotNumber}>
                  {lot.lotNumber} (Stock: {lot.quantity} {lot.unit || "kg"})
                </option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label>Issue Quantity</label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              name="issueQuantity"
              value={formData.issueQuantity}
              onChange={handleChange}
              required
              placeholder="Enter quantity"
            />
          </div>
        </div>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label>Expected Return Date</label>
            <input
              type="date"
              name="expectedReturnDate"
              value={formData.expectedReturnDate}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className={styles.formGroup}>
          <label>Notes</label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            placeholder="Any additional notes"
          />
        </div>

        <button type="submit" className={styles.submitBtn} disabled={loading}>
          {loading ? "Saving..." : "Create Job Work Issue"}
        </button>
      </form>
    </div>
  );
};

export default AddJobWork;
