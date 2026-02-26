import { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import styles from "./Layout.module.css";

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 1024);

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
          <Navbar onMenuToggle={toggleSidebar} />
        </div>

        <div className={styles.content}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default Layout;
