import { useState } from "react";
import { Link } from "react-router-dom";
import API from "../../api/axios";
import DataTable from "../../components/common/DataTable";
import styles from "../sales/SalesList.module.css";

const ProductionPlanList = () => {
  const [rows, setRows] = useState([]);
  const [totalPages, setTotalPages] = useState(1);

  const fetchPlans = async (params) => {
    try {
      const query = new URLSearchParams(params).toString();
      const { data } = await API.get(`/production-plans?${query}`);
      setRows(data.data || []);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      console.error("Error fetching production plans", error);
    }
  };

  const columns = [
    { key: "planNumber", label: "Plan No" },
    { key: "processType", label: "Process" },
    { key: "machineCode", label: "Machine" },
    { key: "shift", label: "Shift" },
    { key: "requiredMaterialType", label: "Input Material" },
    { key: "requiredQuantity", label: "Input Qty" },
    { key: "plannedOutputMaterialType", label: "Output Material" },
    { key: "plannedOutputQuantity", label: "Output Qty" },
    { key: "status", label: "Status" },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Production Planning</h2>
        <Link to="/production-plans/add" className={styles.addBtn}>
          + Add Plan
        </Link>
      </div>
      <DataTable
        columns={columns}
        data={rows}
        serverMode
        totalPages={totalPages}
        onFetchData={fetchPlans}
        searchField="planNumber"
      />
    </div>
  );
};

export default ProductionPlanList;
