import { useState } from "react";
import { Link } from "react-router-dom";
import API from "../../api/axios";
import DataTable from "../../components/common/DataTable";
import styles from "../sales/SalesList.module.css";

const DispatchList = () => {
  const [rows, setRows] = useState([]);
  const [totalPages, setTotalPages] = useState(1);

  const fetchDispatches = async (params) => {
    try {
      const query = new URLSearchParams(params).toString();
      const { data } = await API.get(`/dispatch?${query}`);
      setRows(data.data || []);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      console.error("Error fetching dispatches", error);
    }
  };

  const columns = [
    { key: "dispatchNumber", label: "Dispatch No" },
    {
      key: "customer",
      label: "Customer",
      render: (row) => row.customer?.customerName || "N/A",
    },
    { key: "lotNumber", label: "Lot" },
    { key: "quantity", label: "Qty" },
    { key: "transportName", label: "Transport" },
    { key: "vehicleNumber", label: "Vehicle" },
    { key: "status", label: "Status" },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Dispatch Management</h2>
        <Link to="/dispatch/add" className={styles.addBtn}>
          + Add Dispatch
        </Link>
      </div>
      <DataTable
        columns={columns}
        data={rows}
        serverMode
        totalPages={totalPages}
        onFetchData={fetchDispatches}
        searchField="dispatchNumber"
      />
    </div>
  );
};

export default DispatchList;
