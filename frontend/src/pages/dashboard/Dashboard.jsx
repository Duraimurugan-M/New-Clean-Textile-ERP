import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import ReactECharts from "echarts-for-react";
import * as echarts from "echarts";
import API from "../../api/axios";
import styles from "./Dashboard.module.css";

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [range, setRange] = useState("daily");
  const [growthMode, setGrowthMode] = useState("percent");
  const [themeVersion, setThemeVersion] = useState(0);
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
    fetchDashboard();
  }, [fetchDashboard]);

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setThemeVersion((prev) => prev + 1);
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

    fetchDashboard();
    const timer = setInterval(() => {
      fetchDashboard();
    }, 8000);

    return () => clearInterval(timer);
  }, [analyticsInView, fetchDashboard]);

  const metrics = data || {};

  const salesLabels =
    metrics.monthlySales?.map((item) => {
      if (range === "yearly") return item._id.year;
      if (range === "weekly") return `W${item._id.week}`;
      if (range === "daily") return `${item._id.day}/${item._id.month}`;
      return `${item._id.month}/${item._id.year}`;
    }) || [];

  const salesValues = metrics.monthlySales?.map((item) => Number(item.totalSales || 0)) || [];
  const growthPoints = salesValues.map((currentValue, index) => {
    if (index === 0) {
      return {
        value: 0,
        prev: null,
        current: currentValue,
        isBase: true,
        isNoSales: false,
      };
    }

    const prevValue = Number(salesValues[index - 1] || 0);
    const change = currentValue - prevValue;

    if (prevValue <= 0) {
      return {
        value: 0,
        prev: prevValue,
        current: currentValue,
        isBase: true,
        isNoSales: currentValue === 0,
        change,
      };
    }

    if (currentValue === 0) {
      return {
        value: -100,
        prev: prevValue,
        current: currentValue,
        isBase: false,
        isNoSales: true,
        change,
      };
    }

    const percent = ((currentValue - prevValue) / prevValue) * 100;
    return {
      value: Number(Math.max(percent, -100).toFixed(2)),
      prev: prevValue,
      current: currentValue,
      isBase: false,
      isNoSales: false,
      change,
    };
  });
  const growthValues = growthPoints.map((point) => point.value);
  const changeValues = growthPoints.map((point) =>
    Number((point.current || 0) - (point.prev || 0))
  );
  const topCustomerLabels = metrics.topCustomers?.map((cust) => cust.customerName) || [];
  const topCustomerValues =
    metrics.topCustomers?.map((cust) => Number(cust.totalPurchase || 0)) || [];

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
      isDark: document.documentElement.getAttribute("data-theme") === "dark",
    };
  }, [themeVersion]);

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

  const salesBarOption = {
    animationDuration: 1000,
    animationDurationUpdate: 650,
    animationEasing: "elasticOut",
    animationEasingUpdate: "cubicInOut",
    grid: { left: 12, right: 18, top: 34, bottom: 30, containLabel: true },
    xAxis: {
      type: "category",
      data: salesLabels,
      axisTick: { show: false },
      axisLine: { lineStyle: { color: themeTokens.line } },
      axisLabel: { color: themeTokens.muted },
    },
    yAxis:
      growthMode === "percent"
        ? {
            type: "value",
            min: -100,
            max: 100,
            splitLine: {
              lineStyle: {
                color: themeTokens.line,
                type: "dashed",
              },
            },
            axisLabel: { color: themeTokens.muted, formatter: "{value}%" },
          }
        : {
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
        const point = growthPoints[idx];
        if (!point) return "";

        const prevText = point.prev == null ? "-" : `Rs ${Number(point.prev).toLocaleString()}`;
        const currentText = `Rs ${Number(point.current || 0).toLocaleString()}`;
        const changeText =
          growthMode === "percent"
            ? point.isNoSales
              ? "No Sales"
              : `${point.value}%`
            : `Rs ${Number(point.change || 0).toLocaleString()}`;

        return `${salesLabels[idx] || ""}<br/>Previous: ${prevText}<br/>Current: ${currentText}<br/>Change: ${changeText}`;
      },
      extraCssText: "box-shadow:0 12px 28px rgba(0,0,0,0.22);border-radius:10px;",
    },
    series: [
      {
        name: growthMode === "percent" ? "Growth %" : "Absolute Change",
        type: "bar",
        barWidth: "34%",
        data: growthMode === "percent" ? growthValues : changeValues,
        itemStyle: {
          borderRadius: [8, 8, 0, 0],
          color: ({ value }) =>
            value >= 0
              ? new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                  { offset: 0, color: themeTokens.primary },
                  { offset: 1, color: themeTokens.primary2 },
                ])
              : new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                  { offset: 0, color: "#ef4444" },
                  { offset: 1, color: "#b91c1c" },
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
          formatter: ({ value, dataIndex }) => {
            const point = growthPoints[dataIndex];
            if (growthMode === "percent") {
              if (point?.isNoSales) return "No Sales";
              if (point?.isBase) return "Base";
              return `${value}%`;
            }
            if (point?.isBase) return "Base";
            return `Rs ${Number(value).toLocaleString()}`;
          },
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
          color: ({ value }) => (value >= 0 ? themeTokens.accent : "#ef4444"),
          shadowBlur: 10,
          shadowColor: `${themeTokens.accent}88`,
        },
        data: growthMode === "percent" ? growthValues : changeValues,
      },
    ],
  };

  const customerMixOption = useMemo(() => {
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
  }, [topCustomerLabels, topCustomerValues, themeTokens]);

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
        <motion.div
          className={styles.chartSection}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05 }}
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
        </motion.div>

        <motion.div
          className={styles.chartSection}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1 }}
        >
          <div className={styles.chartHeader}>
            <h3>{growthMode === "percent" ? "Sales Growth %" : "Sales Change (Rs)"}</h3>
            <select value={growthMode} onChange={(e) => setGrowthMode(e.target.value)}>
              <option value="percent">Growth %</option>
              <option value="absolute">Absolute Change (Rs)</option>
            </select>
          </div>
          <div className={styles.chartCanvas}>
            <ReactECharts option={salesBarOption} notMerge style={{ height: "100%", width: "100%" }} />
          </div>
        </motion.div>

        <motion.div
          className={styles.chartSection}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.15 }}
        >
          <div className={styles.chartHeader}>
            <h3>Customer Contribution</h3>
          </div>
          <div className={styles.chartCanvas}>
            <ReactECharts option={customerMixOption} style={{ height: "100%", width: "100%" }} />
          </div>
        </motion.div>

        <motion.div
          className={styles.chartSection}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.2 }}
        >
          <div className={styles.chartHeader}>
            <h3>Efficiency vs Wastage</h3>
          </div>
          <div className={styles.chartCanvas}>
            <ReactECharts option={efficiencyGaugeOption} style={{ height: "100%", width: "100%" }} />
          </div>
        </motion.div>
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
