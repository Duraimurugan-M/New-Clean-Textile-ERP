import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import API from "../../api/axios";
import DataTable from "../../components/common/DataTable";
import styles from "../sales/SalesList.module.css";

const BOMList = () => {
  const [rows, setRows] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [plannedQuantity, setPlannedQuantity] = useState("");
  const [selectedBomId, setSelectedBomId] = useState("");
  const [calculation, setCalculation] = useState(null);
  const [errorText, setErrorText] = useState("");

  const bomOptions = useMemo(
    () =>
      rows.map((bom) => ({
        id: bom._id,
        label: `${bom.bomCode} - ${bom.productName} (V${bom.version})`,
      })),
    [rows]
  );

  const fetchBOMs = async (params) => {
    try {
      const query = new URLSearchParams(params).toString();
      const { data } = await API.get(`/bom?${query}`);
      setRows(data.data || []);
      setTotalPages(data.totalPages || 1);
      if (!selectedBomId && (data.data || []).length > 0) {
        setSelectedBomId(data.data[0]._id);
      }
      setErrorText("");
    } catch (error) {
      console.error("Error fetching BOMs", error);
      setErrorText(error.response?.data?.message || "Failed to load BOMs");
    }
  };

  const toggleStatus = async (row) => {
    try {
      const next = row.status === "Active" ? "Inactive" : "Active";
      await API.patch(`/bom/${row._id}/status`, { status: next });
      setRows((prev) => prev.map((item) => (item._id === row._id ? { ...item, status: next } : item)));
    } catch (error) {
      alert(error.response?.data?.message || "Failed to update status");
    }
  };

  const calculateRequirement = async () => {
    try {
      if (!selectedBomId) {
        alert("Please select BOM");
        return;
      }
      const qty = Number(plannedQuantity);
      if (!qty || qty <= 0) {
        alert("Enter valid planned quantity");
        return;
      }
      const { data } = await API.post(`/bom/${selectedBomId}/calculate-requirement`, {
        plannedQuantity: qty,
      });
      setCalculation(data.data || null);
    } catch (error) {
      alert(error.response?.data?.message || "Failed to calculate requirement");
    }
  };

  const columns = [
    { key: "bomCode", label: "BOM Code" },
    { key: "productName", label: "Product" },
    { key: "productCode", label: "Product Code" },
    { key: "outputMaterialType", label: "Output Material" },
    { key: "outputQuantityPerBatch", label: "Output Qty/Batch" },
    { key: "version", label: "Version" },
    { key: "status", label: "Status" },
    {
      key: "effectiveFrom",
      label: "Effective From",
      render: (row) => new Date(row.effectiveFrom).toLocaleDateString(),
    },
    {
      key: "itemsCount",
      label: "Items",
      render: (row) => row.items?.length || 0,
    },
    {
      key: "actions",
      label: "Action",
      render: (row) => (
        <button className={styles.addBtn} type="button" onClick={() => toggleStatus(row)}>
          {row.status === "Active" ? "Deactivate" : "Activate"}
        </button>
      ),
    },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>BOM Master</h2>
        <Link to="/bom/add" className={styles.addBtn}>
          + Add BOM
        </Link>
      </div>

      <div style={{ marginBottom: 12, display: "grid", gap: 8 }}>
        <h3 style={{ margin: 0 }}>Material Requirement Calculator</h3>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <select value={selectedBomId} onChange={(e) => setSelectedBomId(e.target.value)}>
            <option value="">Select BOM</option>
            {bomOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
          <input
            type="number"
            min="0.0001"
            step="0.0001"
            placeholder="Planned Quantity"
            value={plannedQuantity}
            onChange={(e) => setPlannedQuantity(e.target.value)}
          />
          <button type="button" className={styles.addBtn} onClick={calculateRequirement}>
            Calculate
          </button>
        </div>
      </div>

      {calculation && (
        <div style={{ marginBottom: 12 }}>
          <p style={{ margin: "0 0 8px 0", fontWeight: 700 }}>
            Requirement for {calculation.productName} | Planned Qty: {calculation.plannedQuantity}
          </p>
          <DataTable
            columns={[
              { key: "materialType", label: "Material Type" },
              { key: "materialName", label: "Material Name" },
              { key: "unit", label: "Unit" },
              { key: "baseQty", label: "Base Qty" },
              { key: "wastageQty", label: "Wastage Qty" },
              { key: "requiredQty", label: "Required Qty" },
              { key: "availableQty", label: "Available Qty" },
              { key: "shortageQty", label: "Shortage Qty" },
            ]}
            data={calculation.requirements || []}
            title="bom-requirement"
            showExportButtons={false}
          />
        </div>
      )}

      <DataTable
        columns={columns}
        data={rows}
        serverMode
        totalPages={totalPages}
        onFetchData={fetchBOMs}
        searchField="bomCode / product"
        title="bom-master"
      />
      {errorText && <p style={{ color: "#b91c1c", marginTop: 10 }}>{errorText}</p>}
    </div>
  );
};

export default BOMList;
