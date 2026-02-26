import styles from "./Navbar.module.css";
import { useNavigate } from "react-router-dom";
import API from "../../api/axios";

const Navbar = ({ onMenuToggle }) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await API.post("/auth/logout");
    } catch (error) {
      console.error("Logout failed", error);
    } finally {
      navigate("/");
    }
  };

  return (
    <div className={styles.navbar}>
      <div className={styles.leftGroup}>
        <button
          type="button"
          className={styles.menuBtn}
          onClick={onMenuToggle}
          aria-label="Toggle menu"
        >
          <span />
          <span />
          <span />
        </button>
        <div className={styles.title}>Welcome to Textile ERP</div>
      </div>
      <button type="button" className={styles.logoutBtn} onClick={handleLogout}>
        Logout
      </button>
    </div>
  );
};

export default Navbar;
