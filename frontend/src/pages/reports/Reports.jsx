import { useEffect, useState } from "react";
import API from "../../api/axios";
import DataTable from "../../components/common/DataTable";
import styles from "./Reports.module.css";

const Reports = () => {
  const [ops, setOps] = useState(null);
  const [profit, setProfit] = useState(null);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const [opsRes, profitRes] = await Promise.all([
          API.get("/reports/operations"),
          API.get("/reports/profit"),
        ]);
        setOps(opsRes.data.data);
        setProfit(profitRes.data.data);
      } catch (error) {
        console.error("Reports fetch failed", error);
      }
    };
    fetchReports();
  }, []);

  const download = async (url, filename, type) => {
    try {
      const { data } = await API.get(url, { responseType: "blob" });
      const blob = new Blob([data], { type });
      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(link.href);
    } catch (error) {
      console.error("Export failed", error);
      alert("Export failed");
    }
  };

  if (!ops || !profit) return <p className={styles.loading}>Loading reports...</p>;

  const inventoryColumns = [
    { key: "_id", label: "Material" },
    { key: "totalQty", label: "Total Qty" },
    { key: "totalValue", label: "Total Value", render: (row) => `Rs. ${row.totalValue}` },
  ];

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.hero}>
        <div>
          <p className={styles.kicker}>Business Intelligence</p>
          <h1 className={styles.title}>Reports</h1>
          <p className={styles.subtitle}>Track operations, revenue, costs, and margin from one place.</p>
        </div>
      </div>

      <div className={styles.card}>
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <h4>Revenue</h4>
          <p>Rs. {profit.revenue}</p>
        </div>
        <div className={styles.kpiCard}>
          <h4>Purchase Cost</h4>
          <p>Rs. {profit.purchaseCost}</p>
        </div>
        <div className={styles.kpiCard}>
          <h4>Expenses</h4>
          <p>Rs. {profit.expenseCost}</p>
        </div>
        <div className={styles.kpiCard}>
          <h4>Profit Margin</h4>
          <p>{profit.margin}%</p>
        </div>
      </div>

      <div className={styles.actions}>
        <button onClick={() => download("/reports/operations/export?format=excel", "operations-report.csv", "text/csv")}>
          Export Operations Excel
        </button>
        <button onClick={() => download("/reports/operations/export?format=pdf", "operations-report.pdf", "application/pdf")}>
          Export Operations PDF
        </button>
        <button onClick={() => download("/reports/profit/export?format=excel", "profit-report.csv", "text/csv")}>
          Export Profit Excel
        </button>
        <button onClick={() => download("/reports/profit/export?format=pdf", "profit-report.pdf", "application/pdf")}>
          Export Profit PDF
        </button>
      </div>

      <div className={styles.section}>
        <h3>Inventory Summary</h3>
        <DataTable
          columns={inventoryColumns}
          data={ops.inventory || []}
          showExportButtons={false}
          title="reports-inventory-summary"
        />
        </div>
      </div>
    </div>
  );
};

export default Reports;
