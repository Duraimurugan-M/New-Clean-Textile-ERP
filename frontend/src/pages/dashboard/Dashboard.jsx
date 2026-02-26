import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api/axios";
import styles from "./Dashboard.module.css";

import { Bar, Doughnut, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend
);

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [range, setRange] = useState("monthly");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await API.get(`/dashboard?range=${range}`);
        setData(res.data.data || res.data);
      } catch (err) {
        console.error("Dashboard Error:", err);
      }
    };

    fetchDashboard();
  }, [range]);

  if (!data) return <p>Loading dashboard...</p>;

  const salesLabels =
    data.monthlySales?.map((item) => {
      if (range === "yearly") return item._id.year;
      if (range === "weekly") return `W${item._id.week}`;
      if (range === "daily") return `${item._id.day}/${item._id.month}`;
      return `${item._id.month}/${item._id.year}`;
    }) || [];

  const salesValues = data.monthlySales?.map((item) => item.totalSales) || [];

  const barChartData = {
    labels: salesLabels,
    datasets: [
      {
        label: "Sales Amount",
        data: salesValues,
        backgroundColor: "#0f766e",
        borderRadius: 8,
      },
    ],
  };

  const lineChartData = {
    labels: salesLabels,
    datasets: [
      {
        label: "Sales Trend",
        data: salesValues,
        borderColor: "#d97706",
        backgroundColor: "rgba(217, 119, 6, 0.18)",
        fill: true,
        tension: 0.35,
      },
    ],
  };

  const topCustomerLabels = data.topCustomers?.map((cust) => cust.customerName) || [];
  const topCustomerValues = data.topCustomers?.map((cust) => cust.totalPurchase) || [];

  const customerMixData = {
    labels: topCustomerLabels.length ? topCustomerLabels : ["No customer data"],
    datasets: [
      {
        label: "Customer Share",
        data: topCustomerValues.length ? topCustomerValues : [1],
        backgroundColor: ["#0f766e", "#d97706", "#2563eb", "#be185d", "#7c3aed"],
        borderWidth: 0,
      },
    ],
  };

  const opsHealthData = {
    labels: ["Low Stock", "QC Pending", "Healthy"],
    datasets: [
      {
        label: "Ops Health",
        data: [
          data.lowStockCount ?? 0,
          data.qcPendingCount ?? 0,
          Math.max(
            (data.totalStockQuantity ?? 0) -
              ((data.lowStockCount ?? 0) + (data.qcPendingCount ?? 0)),
            0
          ),
        ],
        backgroundColor: ["#d97706", "#2563eb", "#0f766e"],
        borderWidth: 0,
      },
    ],
  };

  const commonChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: "#374151",
          boxWidth: 12,
          boxHeight: 12,
        },
      },
    },
    scales: {
      x: {
        ticks: { color: "#6b7280" },
        grid: { color: "rgba(148, 163, 184, 0.2)" },
      },
      y: {
        ticks: { color: "#6b7280" },
        grid: { color: "rgba(148, 163, 184, 0.2)" },
      },
    },
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Management Dashboard</h1>

      <div className={styles.kpiGrid}>
        <div className={styles.card}>
          <h4>Total Stock Qty</h4>
          <p>{data.totalStockQuantity ?? 0}</p>
        </div>

        <div className={styles.card}>
          <h4>Total Stock Value</h4>
          <p>Rs. {data.totalStockValue ?? 0}</p>
        </div>

        <div className={styles.card}>
          <h4>Today's Production</h4>
          <p>{data.todayProductionCount ?? 0}</p>
        </div>

        <div className={styles.card}>
          <h4>Today's Sales</h4>
          <p>Rs. {data.todaySalesAmount ?? 0}</p>
        </div>

        <div
          className={`${styles.card} ${styles.alertCard}`}
          onClick={() => navigate("/inventory?lowStock=true")}
        >
          <h4>Low Stock Alerts</h4>
          <p>{data.lowStockCount ?? 0}</p>
        </div>

        <div
          className={`${styles.card} ${styles.warningCard}`}
          onClick={() => navigate("/qc?status=Pending")}
        >
          <h4>QC Pending</h4>
          <p>{data.qcPendingCount ?? 0}</p>
        </div>
      </div>

      <div className={styles.analyticsGrid}>
        <div className={styles.chartSection}>
          <div className={styles.chartHeader}>
            <h3>Sales Overview (Bar)</h3>
            <select value={range} onChange={(e) => setRange(e.target.value)}>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>
          <div className={styles.chartCanvas}>
            <Bar data={barChartData} options={commonChartOptions} />
          </div>
        </div>

        <div className={styles.chartSection}>
          <div className={styles.chartHeader}>
            <h3>Sales Trend (Line)</h3>
          </div>
          <div className={styles.chartCanvas}>
            <Line data={lineChartData} options={commonChartOptions} />
          </div>
        </div>

        <div className={styles.chartSection}>
          <div className={styles.chartHeader}>
            <h3>Top Customer Mix</h3>
          </div>
          <div className={styles.chartCanvas}>
            <Doughnut data={customerMixData} />
          </div>
        </div>

        <div className={styles.chartSection}>
          <div className={styles.chartHeader}>
            <h3>Operational Health</h3>
          </div>
          <div className={styles.chartCanvas}>
            <Doughnut data={opsHealthData} />
          </div>
        </div>
      </div>

      <div className={styles.bottomGrid}>
        <div className={styles.tableSection}>
          <h3>Top Customers</h3>
          <table>
            <thead>
              <tr>
                <th>Customer</th>
                <th>Total Purchase</th>
                <th>Orders</th>
                <th>Last Purchase</th>
                <th>Main Product</th>
              </tr>
            </thead>
            <tbody>
              {data.topCustomers?.map((cust) => (
                <tr key={cust.customerName}>
                  <td>{cust.customerName}</td>
                  <td>Rs. {cust.totalPurchase}</td>
                  <td>{cust.totalOrders}</td>
                  <td>
                    {cust.lastPurchase
                      ? new Date(cust.lastPurchase).toLocaleDateString()
                      : "-"}
                  </td>
                  <td>{cust.mostProduct}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
