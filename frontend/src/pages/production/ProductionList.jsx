import { useState } from "react";
import { Link } from "react-router-dom";
import API from "../../api/axios";
import DataTable from "../../components/common/DataTable";
import styles from "./ProductionList.module.css";

const ProductionList = () => {
  const [productions, setProductions] = useState([]);
  const [totalPages, setTotalPages] = useState(1);

  const fetchProductions = async (params) => {
    try {
      const query = new URLSearchParams(params).toString();
      const { data } = await API.get(`/production?${query}`);

      setProductions(data.data);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      console.error("Error fetching production", error);
    }
  };

  const columns = [
    { key: "processType", label: "Process" },
    { key: "shift", label: "Shift" },
    { key: "machineCode", label: "Machine" },
    { key: "inputLotNumber", label: "Input Lot" },
    { key: "inputQuantity", label: "Input Qty" },
    { key: "outputLotNumber", label: "Output Lot" },
    { key: "outputQuantity", label: "Output Qty" },
    { key: "wastage", label: "Wastage" },
    { key: "wastagePercentage", label: "Wastage %" },
    { key: "efficiencyPercentage", label: "Efficiency %" },
    { key: "totalProcessCost", label: "Process Cost" },
    { key: "costPerOutputUnit", label: "Cost/Unit" },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Production Management</h2>
        <Link to="/production/add" className={styles.addBtn}>
          + Add Production
        </Link>
      </div>

      <DataTable
        columns={columns}
        data={productions}
        serverMode={true}
        totalPages={totalPages}
        onFetchData={fetchProductions}
        searchField="inputLotNumber"
      />
    </div>
  );
};

export default ProductionList;
