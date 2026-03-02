import { useState } from "react";
import { Link } from "react-router-dom";
import API from "../../api/axios";
import DataTable from "../../components/common/DataTable";
import styles from "./JobWork.module.css";
import hero from "../../styles/moduleHero.module.css";

const JobWorkList = () => {
  const [jobWorks, setJobWorks] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [isReceiving, setIsReceiving] = useState(false);

  const fetchJobWorks = async (params) => {
    try {
      const query = new URLSearchParams(params).toString();
      const { data } = await API.get(`/job-work?${query}`);
      setJobWorks(data.data || []);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      console.error("Error fetching job work records", error);
    }
  };

  const handleReceive = async (row) => {
    if (isReceiving) return;

    const input = window.prompt(
      `Enter received quantity for ${row.lotNumber} (Pending: ${row.pendingQuantity})`
    );
    if (!input) return;

    const qty = Number(input);
    if (Number.isNaN(qty) || qty <= 0) {
      alert("Enter a valid quantity");
      return;
    }

    try {
      setIsReceiving(true);
      await API.patch(`/job-work/${row._id}/receive`, {
        receivedQuantity: qty,
      });
      await fetchJobWorks({
        page: 1,
        limit: 10,
        search: "",
        sortBy: "createdAt",
        order: "desc",
      });
    } catch (error) {
      alert(error?.response?.data?.message || "Failed to receive job work");
    } finally {
      setIsReceiving(false);
    }
  };

  const columns = [
    { key: "createdAt", label: "Issue Date", render: (row) => new Date(row.createdAt).toLocaleDateString() },
    { key: "vendor", label: "Vendor", render: (row) => row.vendor?.vendorName || "-" },
    { key: "processType", label: "Process" },
    { key: "materialType", label: "Material" },
    { key: "lotNumber", label: "Lot Number" },
    { key: "issueQuantity", label: "Issued Qty" },
    { key: "receivedQuantity", label: "Received Qty" },
    { key: "pendingQuantity", label: "Pending Qty" },
    {
      key: "status",
      label: "Status",
      render: (row) => (
        <span
          className={`${styles.badge} ${
            row.status === "Received"
              ? styles.success
              : row.status === "PartiallyReceived"
              ? styles.warning
              : styles.pending
          }`}
        >
          {row.status}
        </span>
      ),
    },
    {
      key: "actions",
      label: "Action",
      render: (row) =>
        row.status !== "Received" ? (
          <button
            type="button"
            className={styles.receiveBtn}
            onClick={() => handleReceive(row)}
            disabled={isReceiving}
          >
            Receive
          </button>
        ) : (
          "-"
        ),
    },
  ];

  return (
    <div className={hero.pageWrapper}>
      <div className={hero.hero}>
        <p className={hero.kicker}>Job Work Workspace</p>
        <h1 className={hero.title}>Job Work Management</h1>
        <p className={hero.subtitle}>Track issue/receive cycle, pending quantity, and vendor performance.</p>
      </div>
      <div className={styles.container}>
        <div className={styles.header}>
          <h2>Job Work Register</h2>
          <Link to="/job-work/add" className={styles.addBtn}>
            + Issue Job Work
          </Link>
        </div>

        <DataTable
          columns={columns}
          data={jobWorks}
          serverMode
          totalPages={totalPages}
          onFetchData={fetchJobWorks}
          searchField="Lot Number"
        />
      </div>
    </div>
  );
};

export default JobWorkList;
