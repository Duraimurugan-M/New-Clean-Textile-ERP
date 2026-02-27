import { NavLink } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import {
  FaBox,
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

  const navItems = [
    { to: "/dashboard", icon: <FaTachometerAlt />, label: "Dashboard" },
    { to: "/purchase", icon: <FaShoppingCart />, label: "Purchase" },
    { to: "/inventory", icon: <FaBox />, label: "Inventory" },
    { to: "/production", icon: <FaIndustry />, label: "Production" },
    { to: "/sales", icon: <FaShoppingCart />, label: "Sales" },
    { to: "/customer", icon: <FaUserFriends />, label: "Customer" },
    { to: "/supplier", icon: <FaTruckLoading />, label: "Suppliers" },
    { to: "/qc", icon: <FaIndustry />, label: "QC" },
    { to: "/job-work", icon: <FaTruckLoading />, label: "Job Work" },
    { to: "/stock-movement", icon: <FaTruckLoading />, label: "Stock Movement" },
    { to: "/yarn", icon: <FaBox />, label: "Yarn" },
    { to: "/vendors", icon: <FaTruck />, label: "Vendors" },
  ];

  return (
    <div className={styles.sidebar}>
      <div className={styles.logo}> <span className={styles.span}>EMATIX</span> <br></br> TEXTILE ERP</div>

      <div className={styles.menu}>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={handleNavigate}
            className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ""}`}
          >
            {item.icon}
            {item.label}
          </NavLink>
        ))}
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
