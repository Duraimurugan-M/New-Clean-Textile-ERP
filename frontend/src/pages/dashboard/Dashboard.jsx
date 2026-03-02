import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import ReactECharts from "echarts-for-react";
import * as echarts from "echarts";
import API from "../../api/axios";
import styles from "./Dashboard.module.css";

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [range, setRange] = useState("daily");
  const [isDarkTheme, setIsDarkTheme] = useState(
    document.documentElement.getAttribute("data-theme") === "dark"
  );
  const [analyticsInView, setAnalyticsInView] = useState(false);
  const navigate = useNavigate();
  const analyticsRef = useRef(null);

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await API.get(`/dashboard?range=${range}&ts=${Date.now()}`);
      setData(res.data.data || res.data);
    } catch (err) {
      console.error("Dashboard Error:", err);
    }
  }, [range]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchDashboard();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchDashboard]);

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDarkTheme(document.documentElement.getAttribute("data-theme") === "dark");
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme", "data-section"],
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!analyticsRef.current) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setAnalyticsInView(entry.isIntersecting);
      },
      { threshold: 0.35 }
    );

    observer.observe(analyticsRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!analyticsInView) return undefined;

    const firstFetch = setTimeout(() => {
      fetchDashboard();
    }, 0);
    const timer = setInterval(() => {
      fetchDashboard();
    }, 8000);

    return () => {
      clearTimeout(firstFetch);
      clearInterval(timer);
    };
  }, [analyticsInView, fetchDashboard]);

  const metrics = data || {};

  const formatBucketLabel = (item) => {
    if (range === "yearly") return item._id.year;
    if (range === "weekly") return `W${item._id.week}`;
    if (range === "daily") return `${item._id.day}/${item._id.month}`;
    return `${item._id.month}/${item._id.year}`;
  };

  const salesLabels = metrics.monthlySales?.map((item) => formatBucketLabel(item)) || [];
  const purchaseLabels = metrics.monthlyPurchase?.map((item) => formatBucketLabel(item)) || [];

  const salesValues = metrics.monthlySales?.map((item) => Number(item.totalSales || 0)) || [];
  const purchaseValues =
    metrics.monthlyPurchase?.map((item) => Number(item.totalPurchase || 0)) || [];
  const themeTokens = useMemo(() => {
    const rootStyle = getComputedStyle(document.documentElement);
    return {
      text: rootStyle.getPropertyValue("--text").trim() || "#0f172a",
      muted: rootStyle.getPropertyValue("--text-muted").trim() || "#64748b",
      line: rootStyle.getPropertyValue("--line").trim() || "#d8e2ea",
      primary: rootStyle.getPropertyValue("--primary").trim() || "#0b5f87",
      primary2: rootStyle.getPropertyValue("--primary-2").trim() || "#084c68",
      accent: rootStyle.getPropertyValue("--accent").trim() || "#b76a0a",
      surface2: rootStyle.getPropertyValue("--surface-2").trim() || "#f5f8fb",
      isDark: isDarkTheme,
    };
  }, [isDarkTheme]);

  const commonTooltip = {
    trigger: "axis",
    backgroundColor: themeTokens.isDark ? "rgba(9,18,28,0.96)" : "rgba(255,255,255,0.96)",
    borderColor: themeTokens.line,
    borderWidth: 1,
    textStyle: {
      color: themeTokens.text,
      fontWeight: 600,
    },
    extraCssText: "box-shadow:0 12px 28px rgba(0,0,0,0.22);border-radius:10px;",
  };

  const salesLineOption = {
    animationDuration: 800,
    animationDurationUpdate: 550,
    animationEasingUpdate: "cubicOut",
    tooltip: commonTooltip,
    grid: { left: 12, right: 18, top: 34, bottom: 30, containLabel: true },
    xAxis: {
      type: "category",
      data: salesLabels,
      axisLine: { lineStyle: { color: themeTokens.line } },
      axisLabel: { color: themeTokens.muted },
    },
    yAxis: {
      type: "value",
      splitLine: {
        lineStyle: {
          color: themeTokens.line,
          type: "dashed",
        },
      },
      axisLabel: { color: themeTokens.muted },
    },
        series: [
      {
        name: "Sales",
        type: "line",
        smooth: true,
        symbol: "circle",
        symbolSize: 8,
        data: salesValues,
        lineStyle: { width: 4, color: themeTokens.accent },
        itemStyle: {
          color: themeTokens.accent,
          borderColor: themeTokens.surface2,
          borderWidth: 2,
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: `${themeTokens.accent}AA` },
            { offset: 1, color: `${themeTokens.accent}0D` },
          ]),
        },
      },
    ],
  };

  const purchaseBarOption = {
    animationDuration: 1000,
    animationDurationUpdate: 650,
    animationEasing: "elasticOut",
    animationEasingUpdate: "cubicInOut",
    grid: { left: 12, right: 18, top: 34, bottom: 30, containLabel: true },
    xAxis: {
      type: "category",
      data: purchaseLabels,
      axisTick: { show: false },
      axisLine: { lineStyle: { color: themeTokens.line } },
      axisLabel: { color: themeTokens.muted },
    },
    yAxis: {
      type: "value",
      splitLine: {
        lineStyle: {
          color: themeTokens.line,
          type: "dashed",
        },
      },
      axisLabel: {
        color: themeTokens.muted,
        formatter: (value) => `Rs ${Number(value).toLocaleString()}`,
      },
    },
    tooltip: {
      trigger: "axis",
      backgroundColor: themeTokens.isDark ? "rgba(9,18,28,0.96)" : "rgba(255,255,255,0.96)",
      borderColor: themeTokens.line,
      borderWidth: 1,
      textStyle: {
        color: themeTokens.text,
        fontWeight: 600,
      },
      formatter: (params) => {
        const idx = params?.[0]?.dataIndex ?? 0;
        const current = Number(purchaseValues[idx] || 0);
        const prev = idx > 0 ? Number(purchaseValues[idx - 1] || 0) : null;
        const change = prev == null ? 0 : current - prev;
        const changeText =
          prev == null
            ? "Base period"
            : `${change >= 0 ? "+" : ""}Rs ${Math.abs(change).toLocaleString()}`;
        return `${purchaseLabels[idx] || ""}<br/>Purchase: Rs ${current.toLocaleString()}<br/>Change: ${changeText}`;
      },
      extraCssText: "box-shadow:0 12px 28px rgba(0,0,0,0.22);border-radius:10px;",
    },
    series: [
      {
        name: "Purchase",
        type: "bar",
        barWidth: "42%",
        data: purchaseValues,
        itemStyle: {
          borderRadius: [8, 8, 0, 0],
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: themeTokens.primary },
            { offset: 1, color: themeTokens.primary2 },
          ]),
          shadowColor: `${themeTokens.primary}99`,
          shadowBlur: 18,
          shadowOffsetY: 4,
        },
        label: {
          show: true,
          position: "top",
          color: themeTokens.text,
          fontWeight: 700,
          formatter: ({ value }) => `Rs ${Number(value).toLocaleString()}`,
        },
      },
      {
        type: "pictorialBar",
        symbol: "roundRect",
        symbolSize: [20, 8],
        symbolOffset: [0, -4],
        symbolPosition: "end",
        z: 10,
        itemStyle: {
          color: themeTokens.accent,
          shadowBlur: 10,
          shadowColor: `${themeTokens.accent}88`,
        },
        data: purchaseValues,
      },
    ],
  };

  const customerMixOption = useMemo(() => {
    const topCustomerLabels = metrics.topCustomers?.map((cust) => cust.customerName) || [];
    const topCustomerValues =
      metrics.topCustomers?.map((cust) => Number(cust.totalPurchase || 0)) || [];
    const total = topCustomerValues.reduce((acc, val) => acc + val, 0);
    const palette = [
      themeTokens.primary,
      themeTokens.accent,
      "#7c3aed",
      "#0ea5a7",
      "#ec4899",
      "#f97316",
    ];

    return {
      animationDuration: 900,
      tooltip: {
        trigger: "item",
        backgroundColor: themeTokens.isDark ? "rgba(9,18,28,0.96)" : "rgba(255,255,255,0.96)",
        borderColor: themeTokens.line,
        borderWidth: 1,
        textStyle: { color: themeTokens.text, fontWeight: 600 },
      },
      title: {
        text: `Rs ${total.toLocaleString()}`,
        subtext: "Customer Value",
        left: "center",
        top: "42%",
        textStyle: {
          color: themeTokens.text,
          fontSize: 18,
          fontWeight: 800,
        },
        subtextStyle: {
          color: themeTokens.muted,
          fontWeight: 600,
          fontSize: 12,
        },
      },
      legend: {
        orient: "horizontal",
        bottom: 0,
        textStyle: { color: themeTokens.muted },
      },
      series: [
        {
          name: "Top Customer Mix",
          type: "pie",
          radius: ["52%", "76%"],
          center: ["50%", "44%"],
          avoidLabelOverlap: true,
          itemStyle: {
            borderRadius: 8,
            borderColor: themeTokens.surface2,
            borderWidth: 2,
          },
          label: { show: false },
          emphasis: { scale: true, scaleSize: 8 },
          data:
            topCustomerLabels.length > 0
              ? topCustomerLabels.map((label, index) => ({
                  name: label,
                  value: topCustomerValues[index],
                  itemStyle: { color: palette[index % palette.length] },
                }))
              : [{ name: "No customer data", value: 1, itemStyle: { color: themeTokens.line } }],
        },
      ],
    };
  }, [metrics.topCustomers, themeTokens]);

  const efficiencyGaugeOption = useMemo(() => {
    const efficiency = Number(metrics.avgEfficiency ?? 0);
    const wastage = Number(metrics.avgWastage ?? 0);

    const buildGauge = (value, name, center, color) => ({
      type: "gauge",
      center,
      radius: "72%",
      min: 0,
      max: 100,
      startAngle: 210,
      endAngle: -30,
      splitNumber: 5,
      progress: { show: true, width: 12, itemStyle: { color } },
      pointer: { show: false },
      axisLine: {
        lineStyle: {
          width: 12,
          color: [[1, themeTokens.line]],
        },
      },
      axisTick: { show: false },
      splitLine: { show: false },
      axisLabel: { show: false },
      title: {
        color: themeTokens.muted,
        fontSize: 12,
        fontWeight: 700,
        offsetCenter: [0, "72%"],
      },
      detail: {
        valueAnimation: true,
        color: themeTokens.text,
        fontSize: 20,
        fontWeight: 800,
        formatter: "{value}%",
        offsetCenter: [0, "6%"],
      },
      data: [{ value: Number(value.toFixed(2)), name }],
    });

    return {
      animationDuration: 900,
      series: [
        buildGauge(efficiency, "Efficiency", ["26%", "58%"], themeTokens.primary),
        buildGauge(wastage, "Wastage", ["74%", "58%"], themeTokens.accent),
      ],
    };
  }, [metrics.avgEfficiency, metrics.avgWastage, themeTokens]);

  if (!data) return <div className={styles.loadingState}>Preparing dashboard...</div>;

  return (
    <div className={styles.container}>
      <div className={styles.hero}>
        <div>
          <p className={styles.kicker}>Textile ERP Intelligence</p>
          <h1 className={styles.title}>Management Dashboard</h1>
          <p className={styles.subtitle}>Track operations, stock health, and commercial performance in one view.</p>
        </div>
      </div>

      <div className={styles.kpiGrid}>
        <div className={styles.card}>
          <h4>Total Stock Qty</h4>
          <p>{data.totalStockQuantity ?? 0}</p>
        </div>

        <div className={styles.card}>
          <h4>Total Orders</h4>
          <p>{data.totalOrders ?? 0}</p>
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

        <div className={styles.card}>
          <h4>Machine Efficiency %</h4>
          <p>{data.avgEfficiency ?? 0}</p>
        </div>

        <div className={styles.card}>
          <h4>Wastage %</h4>
          <p>{data.avgWastage ?? 0}</p>
        </div>

        <div className={styles.card}>
          <h4>Yarn Stock Alert</h4>
          <p>{data.yarnStockAlertCount ?? 0}</p>
        </div>

        <div className={styles.card}>
          <h4>Pending Job Work</h4>
          <p>{data.pendingJobWorkCount ?? 0}</p>
        </div>
      </div>

      <h2 className={styles.sectionTitle}>Analytics</h2>
      <div className={styles.analyticsGrid} ref={analyticsRef}>
        <div
          className={styles.chartSection}
        >
          <div className={styles.chartHeader}>
            <h3>Sales Trend</h3>
            <select value={range} onChange={(e) => setRange(e.target.value)}>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>
          <div className={styles.chartCanvas}>
            <ReactECharts option={salesLineOption} notMerge style={{ height: "100%", width: "100%" }} />
          </div>
        </div>

        <div
          className={styles.chartSection}
        >
          <div className={styles.chartHeader}>
            <h3>Purchase Trend</h3>
          </div>
          <div className={styles.chartCanvas}>
            <ReactECharts option={purchaseBarOption} notMerge style={{ height: "100%", width: "100%" }} />
          </div>
        </div>

        <div
          className={styles.chartSection}
        >
          <div className={styles.chartHeader}>
            <h3>Customer Contribution</h3>
          </div>
          <div className={styles.chartCanvas}>
            <ReactECharts option={customerMixOption} style={{ height: "100%", width: "100%" }} />
          </div>
        </div>

        <div
          className={styles.chartSection}
        >
          <div className={styles.chartHeader}>
            <h3>Efficiency vs Wastage</h3>
          </div>
          <div className={styles.chartCanvas}>
            <ReactECharts option={efficiencyGaugeOption} style={{ height: "100%", width: "100%" }} />
          </div>
        </div>
      </div>

      <h2 className={styles.sectionTitle}>Performance Tables</h2>
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
                  <td>{cust.lastPurchase ? new Date(cust.lastPurchase).toLocaleDateString() : "-"}</td>
                  <td>{cust.mostProduct}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className={styles.tableSection}>
          <h3>Top Job Worker Performance</h3>
          <table>
            <thead>
              <tr>
                <th>Vendor</th>
                <th>Issued</th>
                <th>Received</th>
                <th>Avg Wastage %</th>
              </tr>
            </thead>
            <tbody>
              {(data.topJobWorkers || []).map((row, index) => (
                <tr key={`${row.vendorName || "vendor"}-${index}`}>
                  <td>{row.vendorName || "N/A"}</td>
                  <td>{row.totalIssued}</td>
                  <td>{row.totalReceived}</td>
                  <td>{row.avgWastage ?? 0}</td>
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
