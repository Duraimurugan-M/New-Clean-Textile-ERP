import styles from "./Navbar.module.css";
import { FaMoon, FaSun } from "react-icons/fa";

const Navbar = ({ onMenuToggle, theme, onThemeToggle }) => {
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
        <div className={styles.title}>Welcome to Ematix Textile ERP</div>
      </div>
      <button
        type="button"
        className={styles.themeBtn}
        onClick={onThemeToggle}
        aria-label="Toggle theme"
      >
        {theme === "dark" ? <FaSun /> : <FaMoon />}
        {theme === "dark" ? "Light" : "Dark"}
      </button>
    </div>
  );
};

export default Navbar;
