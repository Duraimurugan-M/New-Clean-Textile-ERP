import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import {
  FaBox,
  FaClipboardList,
  FaCogs,
  FaChevronDown,
  FaChevronRight,
  FaMoneyCheckAlt,
  FaSignOutAlt,
  FaShoppingCart,
  FaTachometerAlt,
  FaTruck,
  FaTruckLoading,
  FaIndustry,
  FaUserFriends,
} from "react-icons/fa";
import styles from "./Sidebar.module.css";
import API from "../../api/axios";

const Sidebar = ({ onNavigate }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigate = () => {
    if (onNavigate) onNavigate();
  };

  const handleLogout = async () => {
    try {
      await API.post("/auth/logout");
    } catch (error) {
      console.error("Logout failed", error);
    } finally {
      navigate("/");
      handleNavigate();
    }
  };

  const categories = useMemo(
    () => [
      {
        key: "dashboard",
        label: "Dashboard",
        icon: <FaTachometerAlt />,
        items: [{ to: "/dashboard", label: "Overview" }],
      },
      {
        key: "sales",
        label: "Sales",
        icon: <FaShoppingCart />,
        items: [
          { to: "/sales-orders", label: "Sales Orders" },
          { to: "/sales", label: "Sales Invoices" },
          { to: "/customer", label: "Customers" },
        ],
      },
      {
        key: "purchase",
        label: "Purchase",
        icon: <FaShoppingCart />,
        items: [
          { to: "/purchase", label: "Purchases" },
          { to: "/supplier", label: "Suppliers" },
        ],
      },
      {
        key: "production",
        label: "Production",
        icon: <FaIndustry />,
        items: [
          { to: "/production", label: "Production Entry" },
          { to: "/production-plans", label: "Production Planning" },
          { to: "/beams", label: "Beam Management" },
        ],
      },
      {
        key: "inventory",
        label: "Inventory",
        icon: <FaBox />,
        items: [
          { to: "/inventory", label: "Stock" },
          { to: "/stock-movement", label: "Stock Movement" },
        ],
      },
      {
        key: "jobwork",
        label: "Job Work",
        icon: <FaTruckLoading />,
        items: [
          { to: "/job-work", label: "Job Work Register" },
          { to: "/vendors", label: "Vendors" },
        ],
      },
      {
        key: "quality",
        label: "Quality Control",
        icon: <FaCogs />,
        items: [{ to: "/qc", label: "QC Records" }],
      },
      {
        key: "dispatch",
        label: "Dispatch",
        icon: <FaTruck />,
        items: [{ to: "/dispatch", label: "Dispatch Register" }],
      },
      {
        key: "accounts",
        label: "Accounts",
        icon: <FaMoneyCheckAlt />,
        items: [
          { to: "/accounts", label: "General Ledger" },
          { to: "/accounts?tab=purchase", label: "Purchase Ledger" },
          { to: "/accounts?tab=sales", label: "Sales Ledger" },
          { to: "/accounts?tab=expense", label: "Expense Ledger" },
        ],
      },
      {
        key: "reports",
        label: "Reports",
        icon: <FaClipboardList />,
        items: [{ to: "/reports", label: "Report Center" }],
      },
      {
        key: "settings",
        label: "Settings",
        icon: <FaCogs />,
        items: [{ to: "/dashboard", label: "Role & Access (Soon)" }],
      },
    ],
    []
  );

  const detectOpen = () => {
    const path = location.pathname;
    const found = categories.find((category) =>
      category.items.some((item) => item.to.split("?")[0] === path)
    );
    return found ? found.key : "dashboard";
  };

  const [openCategory, setOpenCategory] = useState(detectOpen());

  useEffect(() => {
    setOpenCategory(detectOpen());
  }, [location.pathname, location.search]);

  return (
    <div className={styles.sidebar}>
      <div className={styles.logo}> <span className={styles.span}>EMATIX</span> <br></br> TEXTILE ERP</div>

      <div className={styles.menu}>
        {categories.map((category) => {
          const isOpen = openCategory === category.key;
          return (
            <div key={category.key} className={styles.group}>
              <button
                type="button"
                className={styles.groupBtn}
                onClick={() => setOpenCategory(isOpen ? "" : category.key)}
              >
                <span className={styles.groupLabel}>
                  {category.icon}
                  {category.label}
                </span>
                {isOpen ? <FaChevronDown /> : <FaChevronRight />}
              </button>

              {isOpen && (
                <div className={styles.subMenu}>
                  {category.items.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={handleNavigate}
                      className={({ isActive }) => `${styles.subNavItem} ${isActive ? styles.active : ""}`}
                    >
                      {item.label}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className={styles.sidebarFooter}>
        <button type="button" className={styles.logoutBtn} onClick={handleLogout}>
          <FaSignOutAlt />
          Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
