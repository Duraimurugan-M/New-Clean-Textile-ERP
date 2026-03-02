import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import API from "../../api/axios";
import DataTable from "../../components/common/DataTable";
import styles from "./QCList.module.css";
import hero from "../../styles/moduleHero.module.css";

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
    <div className={hero.pageWrapper}>
      <div className={hero.hero}>
        <p className={hero.kicker}>Quality Workspace</p>
        <h1 className={hero.title}>QC Management</h1>
        <p className={hero.subtitle}>Record inspection outcome and control lot release for sales/dispatch.</p>
      </div>
      <div className={styles.container}>
        <div className={styles.header}>
          <h2>QC Register</h2>
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
          searchField="Lot Number"
        />
      </div>
    </div>
  );
};

export default QCList;
