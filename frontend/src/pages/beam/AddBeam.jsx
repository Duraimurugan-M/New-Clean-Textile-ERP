import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api/axios";
import styles from "../sales/AddSales.module.css";

const AddBeam = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    beamNumber: "",
    sourceMaterialType: "RawYarn",
    sourceLotNumber: "",
    issueQuantity: "",
    unit: "kg",
    warpLengthMeters: "",
    endsCount: "",
    loomNumber: "",
    notes: "",
  });

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await API.post("/beams", form);
      navigate("/beams");
    } catch (error) {
      alert(error.response?.data?.message || "Failed to create beam");
    }
  };

  return (
    <div className={styles.container}>
      <h2>Create Beam</h2>
      <form onSubmit={handleSubmit} className={styles.form}>
        <input name="beamNumber" placeholder="Beam Number" onChange={handleChange} required />
        <select name="sourceMaterialType" value={form.sourceMaterialType} onChange={handleChange}>
          <option value="RawYarn">Raw Yarn</option>
          <option value="DyedYarn">Dyed Yarn</option>
        </select>
        <input name="sourceLotNumber" placeholder="Source Lot Number" onChange={handleChange} required />
        <input name="issueQuantity" type="number" placeholder="Issue Quantity" onChange={handleChange} required />
        <select name="unit" value={form.unit} onChange={handleChange}>
          <option value="kg">kg</option>
          <option value="meter">meter</option>
        </select>
        <input name="warpLengthMeters" type="number" placeholder="Warp Length (m)" onChange={handleChange} />
        <input name="endsCount" type="number" placeholder="Ends Count" onChange={handleChange} />
        <input name="loomNumber" placeholder="Loom Number" onChange={handleChange} />
        <input name="notes" placeholder="Notes" onChange={handleChange} />
        <button type="submit" className={styles.button}>
          Save Beam
        </button>
      </form>
    </div>
  );
};

export default AddBeam;
