import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import styles from "./Layout.module.css";

const getInitialTheme = () => {
  const storedTheme = localStorage.getItem("erp-theme");
  if (storedTheme === "light" || storedTheme === "dark") {
    return storedTheme;
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

const Layout = ({ children }) => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 1024);
  const [theme, setTheme] = useState(getInitialTheme);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    const onResize = () => {
      const mobile = window.innerWidth <= 1024;
      setIsMobile(mobile);
      if (!mobile) setSidebarOpen(false);
    };

    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (isMobile && sidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobile, sidebarOpen]);

  const closeSidebar = () => setSidebarOpen(false);
  const toggleSidebar = () => setSidebarOpen((prev) => !prev);
  const toggleTheme = () => setTheme((prev) => (prev === "dark" ? "light" : "dark"));

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("erp-theme", theme);
  }, [theme]);

  useEffect(() => {
    const pathname = location.pathname || "/dashboard";
    const first = pathname.split("/").filter(Boolean)[0] || "dashboard";

    const sectionMap = {
      dashboard: "dashboard",
      sales: "sales",
      "sales-orders": "sales",
      purchase: "purchase",
      production: "production",
      "production-plans": "production",
      inventory: "inventory",
      "stock-movement": "inventory",
      customer: "sales",
      supplier: "purchase",
      qc: "qc",
      "job-work": "jobwork",
      vendors: "jobwork",
      dispatch: "dispatch",
      accounts: "accounts",
      reports: "reports",
      tools: "tools",
      settings: "settings",
      beams: "production",
    };

    document.documentElement.setAttribute("data-section", sectionMap[first] || "dashboard");
  }, [location.pathname]);

  useEffect(() => {
    setPageLoading(true);
    const timer = setTimeout(() => setPageLoading(false), 220);
    return () => clearTimeout(timer);
  }, [location.pathname, location.search]);

  return (
    <div className={styles.layout}>
      <div
        className={`${styles.backdrop} ${sidebarOpen ? styles.backdropShow : ""}`}
        onClick={closeSidebar}
      />

      <div className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ""}`}>
        <Sidebar onNavigate={closeSidebar} />
      </div>

      <div className={styles.main}>
        <div className={styles.navWrapper}>
          <Navbar onMenuToggle={toggleSidebar} theme={theme} onThemeToggle={toggleTheme} />
        </div>

        <div className={styles.content}>
          {pageLoading ? (
            <div className={styles.pageSkeleton} aria-hidden="true">
              <div className={styles.skelHero} />
              <div className={styles.skelGrid}>
                <div className={styles.skelCard} />
                <div className={styles.skelCard} />
                <div className={styles.skelCard} />
                <div className={styles.skelCard} />
              </div>
              <div className={styles.skelTable} />
            </div>
          ) : (
            children
          )}
        </div>
      </div>
    </div>
  );
};

export default Layout;
