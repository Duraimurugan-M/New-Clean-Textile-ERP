import { NavLink } from "react-router-dom";
import {
  FaBox,
  FaShoppingCart,
  FaTachometerAlt,
  FaTruck,
  FaTruckLoading,
  FaIndustry,
  FaUserFriends,
} from "react-icons/fa";
import styles from "./Sidebar.module.css";

const Sidebar = ({ onNavigate }) => {
  const handleNavigate = () => {
    if (onNavigate) onNavigate();
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
    </div>
  );
};

export default Sidebar;
