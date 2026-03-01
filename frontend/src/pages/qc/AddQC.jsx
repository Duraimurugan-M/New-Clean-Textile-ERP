import { useEffect, useState } from "react";
import API from "../../api/axios";
import styles from "./AddQC.module.css";
import { useNavigate } from "react-router-dom";

const AddQC = () => {
  const navigate = useNavigate();
  const [lots, setLots] = useState([]);
  const [form, setForm] = useState({
    lotNumber: "",
    gsm: "",
    width: "",
    shrinkage: "",
    defectPercentage: "",
    grade: "A",
    status: "Approved",
  });

  useEffect(() => {
    const fetchLots = async () => {
      try {
        const { data } = await API.get("/inventory");

        // Only FinishedFabric with stock > 0
        const finishedLots = data.data.filter(
          (item) =>
            item.materialType === "FinishedFabric" &&
            item.quantity > 0
        );

        setLots(finishedLots);
      } catch (error) {
        console.error("Error loading lots", error);
      }
    };

    fetchLots();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await API.post("/qc", form);
      navigate("/qc");
    } catch (error) {
      alert(error.response?.data?.message || "QC error");
    }
  };

  return (
    <div className={styles.container}>
      <h2>Quality Control Inspection</h2>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div style={{ display: "grid", gap: 6 }}>
          <label>Lot Number</label>
          <select
            name="lotNumber"
            value={form.lotNumber}
            onChange={handleChange}
            required
          >
            <option value="">Select Finished Lot</option>
            {lots.map((lot) => (
              <option key={lot._id} value={lot.lotNumber}>
                {lot.lotNumber}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: "grid", gap: 6 }}>
          <label>GSM</label>
          <input
            type="number"
            name="gsm"
            placeholder="GSM"
            onChange={handleChange}
            required
          />
        </div>

        <div style={{ display: "grid", gap: 6 }}>
          <label>Width</label>
          <input
            type="number"
            name="width"
            placeholder="Width"
            onChange={handleChange}
            required
          />
        </div>

        <div style={{ display: "grid", gap: 6 }}>
          <label>Shrinkage %</label>
          <input
            type="number"
            name="shrinkage"
            placeholder="Shrinkage %"
            onChange={handleChange}
            required
          />
        </div>

        <div style={{ display: "grid", gap: 6 }}>
          <label>Defect %</label>
          <input
            type="number"
            name="defectPercentage"
            placeholder="Defect %"
            onChange={handleChange}
            required
          />
        </div>

        <div style={{ display: "grid", gap: 6 }}>
          <label>Grade</label>
          <select name="grade" onChange={handleChange}>
            <option value="A">Grade A</option>
            <option value="B">Grade B</option>
            <option value="C">Grade C</option>
          </select>
        </div>

        <div style={{ display: "grid", gap: 6 }}>
          <label>Status</label>
          <select name="status" onChange={handleChange}>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>

        <button type="submit">Submit QC</button>
      </form>
    </div>
  );
};

export default AddQC;
