import { useEffect, useState } from "react";
import API from "../../api/axios";
import styles from "./AddProduction.module.css";
import { useNavigate } from "react-router-dom";

const flowMap = {
  RawYarn: "DyedYarn",
  DyedYarn: "GreyFabric",
  GreyFabric: "FinishedFabric",
};

const AddProduction = () => {
  const navigate = useNavigate();

  const [inventory, setInventory] = useState([]);
  const [availableQty, setAvailableQty] = useState(0);

  const [form, setForm] = useState({
    processType: "Dyeing",
    shift: "General",
    machineCode: "",
    inputMaterialType: "",
    inputLotNumber: "",
    inputQuantity: "",
    outputMaterialType: "",
    outputLotNumber: "",
    outputQuantity: "",
    labourCost: "",
    machineCost: "",
    dyeChemicalCost: "",
    otherCost: "",
  });

  // Load inventory
  useEffect(() => {
    const fetchInventory = async () => {
      const { data } = await API.get("/inventory");
      setInventory(data.data);
    };
    fetchInventory();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "inputMaterialType") {
      setForm({
        ...form,
        inputMaterialType: value,
        outputMaterialType: flowMap[value] || "",
        inputLotNumber: "",
        outputLotNumber: "",
      });
      setAvailableQty(0);
      return;
    }

   if (name === "inputLotNumber") {
     const selectedLot = inventory.find(
       (item) =>
         item.materialType === form.inputMaterialType &&
         item.lotNumber === value &&
         item.quantity > 0,
     );

     setAvailableQty(selectedLot ? selectedLot.quantity : 0);
   }

    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (Number(form.inputQuantity) > availableQty) {
      alert("Input quantity exceeds available stock!");
      return;
    }

    try {
      await API.post("/production", form);
      navigate("/production");
    } catch (error) {
      alert(error.response?.data?.message || "Production error");
    }
  };

const inputLots = inventory.filter(
  (item) => item.materialType === form.inputMaterialType && item.quantity > 0,
);

  return (
    <div className={styles.container}>
      <h2>Create Production</h2>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div style={{ display: "grid", gap: 6 }}>
          <label>Process Type</label>
          <select
            name="processType"
            value={form.processType}
            onChange={handleChange}
          >
            <option value="Dyeing">Dyeing</option>
            <option value="Bleaching">Bleaching</option>
            <option value="Weaving">Weaving</option>
            <option value="Washing">Washing</option>
            <option value="Finishing">Finishing</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div style={{ display: "grid", gap: 6 }}>
          <label>Shift</label>
          <select
            name="shift"
            value={form.shift}
            onChange={handleChange}
          >
            <option value="General">General</option>
            <option value="A">Shift A</option>
            <option value="B">Shift B</option>
            <option value="C">Shift C</option>
          </select>
        </div>

        <div style={{ display: "grid", gap: 6 }}>
          <label>Machine Code</label>
          <input
            name="machineCode"
            placeholder="Machine Code"
            value={form.machineCode}
            onChange={handleChange}
          />
        </div>

        <div style={{ display: "grid", gap: 6 }}>
          <label>Input Material Type</label>
          <select
            name="inputMaterialType"
            value={form.inputMaterialType}
            onChange={handleChange}
            required
          >
            <option value="">Select Input Material</option>
            <option value="RawYarn">Raw Yarn</option>
            <option value="DyedYarn">Dyed Yarn</option>
            <option value="GreyFabric">Grey Fabric</option>
          </select>
        </div>

        <div style={{ display: "grid", gap: 6 }}>
          <label>Input Lot Number</label>
          <select
            name="inputLotNumber"
            value={form.inputLotNumber}
            onChange={handleChange}
            required
          >
            <option value="">Select Input Lot</option>
            {inputLots.map((lot) => (
              <option key={lot._id} value={lot.lotNumber}>
                {lot.lotNumber} (Available: {lot.quantity})
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: "grid", gap: 6 }}>
          <label>Input Quantity</label>
          <input
            name="inputQuantity"
            type="number"
            placeholder={`Available: ${availableQty}`}
            onChange={handleChange}
            required
          />
        </div>

        <div style={{ display: "grid", gap: 6 }}>
          <label>Output Material Type</label>
          <input
            type="text"
            value={form.outputMaterialType}
            disabled
          />
        </div>

        <div style={{ display: "grid", gap: 6 }}>
          <label>Output Lot Number</label>
          <input
            name="outputLotNumber"
            placeholder="Output Lot Number"
            onChange={handleChange}
            required
          />
        </div>

        <div style={{ display: "grid", gap: 6 }}>
          <label>Output Quantity</label>
          <input
            name="outputQuantity"
            type="number"
            placeholder="Output Quantity"
            onChange={handleChange}
            required
          />
        </div>

        <div style={{ display: "grid", gap: 6 }}>
          <label>Labour Cost</label>
          <input
            name="labourCost"
            type="number"
            placeholder="Labour Cost"
            onChange={handleChange}
          />
        </div>
        <div style={{ display: "grid", gap: 6 }}>
          <label>Machine Cost</label>
          <input
            name="machineCost"
            type="number"
            placeholder="Machine Cost"
            onChange={handleChange}
          />
        </div>
        <div style={{ display: "grid", gap: 6 }}>
          <label>Dye/Chemical Cost</label>
          <input
            name="dyeChemicalCost"
            type="number"
            placeholder="Dye/Chemical Cost"
            onChange={handleChange}
          />
        </div>
        <div style={{ display: "grid", gap: 6 }}>
          <label>Other Cost</label>
          <input
            name="otherCost"
            type="number"
            placeholder="Other Cost"
            onChange={handleChange}
          />
        </div>

        <button type="submit">Save Production</button>
      </form>
    </div>
  );
};

export default AddProduction;
