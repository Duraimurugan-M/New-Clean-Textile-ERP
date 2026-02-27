import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useLocation } from "react-router-dom";
import API from "../../api/axios";
import DataTable from "../../components/common/DataTable";
import styles from "../sales/SalesList.module.css";

const AccountsList = () => {
  const location = useLocation();
  const [entries, setEntries] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [summary, setSummary] = useState({ pendingPayables: 0, pendingReceivables: 0 });
  const [tab, setTab] = useState(new URLSearchParams(location.search).get("tab") || "all");

  useEffect(() => {
    setTab(new URLSearchParams(location.search).get("tab") || "all");
  }, [location.search]);

  const endpoint = useMemo(() => {
    if (tab === "purchase") return "/accounts/purchase-ledger";
    if (tab === "sales") return "/accounts/sales-ledger";
    if (tab === "expense") return "/accounts/expense-ledger";
    return "/accounts";
  }, [tab]);

  const fetchSummary = async () => {
    try {
      const { data } = await API.get("/accounts/summary");
      setSummary(data.data || { pendingPayables: 0, pendingReceivables: 0 });
    } catch (error) {
      console.error("Summary error", error);
    }
  };

  const fetchEntries = async (params) => {
    try {
      const query = new URLSearchParams(params).toString();
      const { data } = await API.get(`${endpoint}?${query}`);
      setEntries(data.data || []);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      console.error("Error fetching accounts", error);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  const handleExport = async (format) => {
    try {
      const { data } = await API.get(`/accounts/export?type=${tab}&format=${format}`, {
        responseType: "blob",
      });
      const ext = format === "pdf" ? "pdf" : "csv";
      const blob = new Blob([data], {
        type: format === "pdf" ? "application/pdf" : "text/csv",
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${tab}-ledger.${ext}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export failed", error);
      alert("Failed to export ledger");
    }
  };

  const columns = [
    { key: "entryType", label: "Type" },
    { key: "partyType", label: "Party Type" },
    { key: "partyName", label: "Party" },
    { key: "amount", label: "Amount" },
    { key: "gstAmount", label: "GST" },
    { key: "status", label: "Status" },
    {
      key: "entryDate",
      label: "Date",
      render: (row) => new Date(row.entryDate).toLocaleDateString(),
    },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Accounts</h2>
        <Link to="/accounts/add" className={styles.addBtn}>
          + Add Entry
        </Link>
      </div>

      <div style={{ marginBottom: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button className={styles.addBtn} onClick={() => setTab("all")} type="button">All</button>
        <button className={styles.addBtn} onClick={() => setTab("purchase")} type="button">Purchase Ledger</button>
        <button className={styles.addBtn} onClick={() => setTab("sales")} type="button">Sales Ledger</button>
        <button className={styles.addBtn} onClick={() => setTab("expense")} type="button">Expense Ledger</button>
        <button className={styles.addBtn} onClick={() => handleExport("excel")} type="button">Export Excel</button>
        <button className={styles.addBtn} onClick={() => handleExport("pdf")} type="button">Export PDF</button>
      </div>

      <div style={{ marginBottom: 12, fontWeight: 700 }}>
        Pending Payables: Rs. {summary.pendingPayables || 0} | Pending Receivables: Rs.{" "}
        {summary.pendingReceivables || 0}
      </div>

      <DataTable
        key={tab}
        columns={columns}
        data={entries}
        serverMode
        totalPages={totalPages}
        onFetchData={fetchEntries}
        searchField="partyName"
      />
    </div>
  );
};

export default AccountsList;
