import { useEffect, useState } from "react";
import API from "../../api/axios";
import styles from "../dashboard/Dashboard.module.css";

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

  if (!ops || !profit) return <p>Loading reports...</p>;

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Reports</h1>
      <div className={styles.kpiGrid}>
        <div className={styles.card}>
          <h4>Revenue</h4>
          <p>Rs. {profit.revenue}</p>
        </div>
        <div className={styles.card}>
          <h4>Purchase Cost</h4>
          <p>Rs. {profit.purchaseCost}</p>
        </div>
        <div className={styles.card}>
          <h4>Expenses</h4>
          <p>Rs. {profit.expenseCost}</p>
        </div>
        <div className={styles.card}>
          <h4>Profit Margin</h4>
          <p>{profit.margin}%</p>
        </div>
      </div>

      <div style={{ marginBottom: 14, display: "flex", gap: 8, flexWrap: "wrap" }}>
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

      <div className={styles.tableSection}>
        <h3>Inventory Summary</h3>
        <table>
          <thead>
            <tr>
              <th>Material</th>
              <th>Total Qty</th>
              <th>Total Value</th>
            </tr>
          </thead>
          <tbody>
            {(ops.inventory || []).map((item) => (
              <tr key={item._id}>
                <td>{item._id}</td>
                <td>{item.totalQty}</td>
                <td>Rs. {item.totalValue}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Reports;
