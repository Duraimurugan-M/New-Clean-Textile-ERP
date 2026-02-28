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
  FaTools,
} from "react-icons/fa";
import styles from "./Sidebar.module.css";
import API from "../../api/axios";

const Sidebar = ({ onNavigate }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [permissions, setPermissions] = useState({});
  const [isAdmin, setIsAdmin] = useState(false);

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

  useEffect(() => {
    const loadPermissions = async () => {
      try {
        const { data } = await API.get("/auth/me");
        const role = data?.user?.role;
        setPermissions(role?.permissions || {});
        setIsAdmin(role?.name === "Admin");
      } catch {
        setPermissions({});
        setIsAdmin(false);
      }
    };
    loadPermissions();
  }, []);

  const hasPermission = (module, action) => {
    if (isAdmin) return true;
    return Boolean(permissions?.[module]?.[action]);
  };

  const categories = useMemo(
    () => [
      {
        key: "dashboard",
        label: "Dashboard",
        icon: <FaTachometerAlt />,
        items: [{ to: "/dashboard", label: "Overview", can: ["dashboard", "view"] }],
      },
      {
        key: "sales",
        label: "Sales",
        icon: <FaShoppingCart />,
        items: [
          { to: "/sales-orders", label: "Sales Orders", can: ["salesOrder", "view"] },
          { to: "/sales", label: "Sales Invoices", can: ["sales", "view"] },
          { to: "/customer", label: "Customers", can: ["sales", "view"] },
        ],
      },
      {
        key: "purchase",
        label: "Purchase",
        icon: <FaShoppingCart />,
        items: [
          { to: "/purchase", label: "Purchases", can: ["purchase", "view"] },
          { to: "/supplier", label: "Suppliers", can: ["purchase", "view"] },
        ],
      },
      {
        key: "production",
        label: "Production",
        icon: <FaIndustry />,
        items: [
          { to: "/production", label: "Production Entry", can: ["production", "view"] },
          { to: "/production-plans", label: "Production Planning", can: ["production", "view"] },
          { to: "/beams", label: "Beam Management", can: ["beam", "view"] },
        ],
      },
      {
        key: "inventory",
        label: "Inventory",
        icon: <FaBox />,
        items: [
          { to: "/inventory", label: "Stock", can: ["inventory", "view"] },
          { to: "/stock-movement", label: "Stock Movement", can: ["reports", "view"] },
        ],
      },
      {
        key: "jobwork",
        label: "Job Work",
        icon: <FaTruckLoading />,
        items: [
          { to: "/job-work", label: "Job Work Register", can: ["jobWork", "view"] },
          { to: "/vendors", label: "Vendors", can: ["jobWork", "view"] },
        ],
      },
      {
        key: "quality",
        label: "Quality Control",
        icon: <FaCogs />,
        items: [{ to: "/qc", label: "QC Records", can: ["qc", "view"] }],
      },
      {
        key: "dispatch",
        label: "Dispatch",
        icon: <FaTruck />,
        items: [{ to: "/dispatch", label: "Dispatch Register", can: ["dispatch", "view"] }],
      },
      {
        key: "accounts",
        label: "Accounts",
        icon: <FaMoneyCheckAlt />,
        items: [
          { to: "/accounts", label: "General Ledger", can: ["accounts", "view"] },
          { to: "/accounts?tab=purchase", label: "Purchase Ledger", can: ["accounts", "view"] },
          { to: "/accounts?tab=sales", label: "Sales Ledger", can: ["accounts", "view"] },
          { to: "/accounts?tab=expense", label: "Expense Ledger", can: ["accounts", "view"] },
        ],
      },
      {
        key: "reports",
        label: "Reports",
        icon: <FaClipboardList />,
        items: [{ to: "/reports", label: "Report Center", can: ["reports", "view"] }],
      },
       {
        key: "tools",
        label: "Tools",
        icon: <FaTools />,
        items: [
          { to: "/tools/todo", label: "Todo List" },
          { to: "/tools/calendar", label: "Calendar" },
        ],
      },
      {
        key: "settings",
        label: "Settings",
        icon: <FaCogs />,
        items: [
          { to: "/settings/roles", label: "Role Access", can: ["settings", "manageRoles"] },
          { to: "/settings/users", label: "Users", can: ["settings", "manageUsers"] },
        ],
      },
    ],
    []
  );

  const visibleCategories = categories
    .map((category) => ({
      ...category,
      items: category.items.filter((item) => {
        const [module, action] = item.can || [];
        if (!module || !action) return true;
        return hasPermission(module, action);
      }),
    }))
    .filter((category) => category.items.length > 0);

  const detectOpen = () => {
    const path = location.pathname;
    const found = visibleCategories.find((category) =>
      category.items.some((item) => item.to.split("?")[0] === path)
    );
    return found ? found.key : "dashboard";
  };

  const [openCategory, setOpenCategory] = useState(detectOpen());

  useEffect(() => {
    setOpenCategory(detectOpen());
  }, [location.pathname, location.search, isAdmin, permissions]);

  return (
    <div className={styles.sidebar}>
      <div className={styles.logo}> <span className={styles.span}>EMATIX</span> <br></br> TEXTILE ERP</div>

      <div className={styles.menu}>
        {visibleCategories.map((category) => {
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
