import styles from "./Navbar.module.css";

const Navbar = ({ onMenuToggle }) => {
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
    </div>
  );
};

export default Navbar;
