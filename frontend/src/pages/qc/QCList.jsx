import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import API from "../../api/axios";
import DataTable from "../../components/common/DataTable";
import styles from "./QCList.module.css";

const QCList = () => {
  const [qcList, setQcList] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const location = useLocation();

  const fetchQC = async (params) => {
    try {
      const merged = new URLSearchParams(location.search);
      Object.entries(params || {}).forEach(([key, value]) => merged.set(key, value));
      const query = merged.toString();
      const { data } = await API.get(`/qc?${query}`);

      setQcList(data.data);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      console.error("Error fetching QC", error);
    }
  };

  const columns = [
    { key: "lotNumber", label: "Lot" },
    { key: "gsm", label: "GSM" },
    { key: "width", label: "Width" },
    {
      key: "defectPercentage",
      label: "Defect %",
      render: (row) => `${row.defectPercentage}%`,
    },
    { key: "grade", label: "Grade" },
    {
      key: "status",
      label: "Status",
      render: (row) => (
        <span
          style={{
            color: row.status === "Approved" ? "green" : "red",
            fontWeight: "600",
          }}
        >
          {row.status}
        </span>
      ),
    },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>QC Management</h2>
        <Link to="/qc/add" className={styles.addBtn}>
          + Add QC
        </Link>
      </div>

      <DataTable
        columns={columns}
        data={qcList}
        serverMode={true}
        totalPages={totalPages}
        onFetchData={fetchQC}
        searchField="lotNumber"
      />
    </div>
  );
};

export default QCList;
