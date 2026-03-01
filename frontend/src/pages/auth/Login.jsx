import { useState } from "react";
import { useEffect } from "react";
import API from "../../api/axios";
import { useNavigate } from "react-router-dom";
import { FaMoon, FaSun } from "react-icons/fa";
import styles from "./Login.module.css";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [theme, setTheme] = useState(() => {
    const storedTheme = localStorage.getItem("erp-theme");
    if (storedTheme === "light" || storedTheme === "dark") return storedTheme;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });
  const navigate = useNavigate();

  useEffect(() => {
    const checkSession = async () => {
      try {
        await API.get("/auth/me");
        navigate("/dashboard");
      } catch {
        // No active session; stay on login
      }
    };

    checkSession();
  }, [navigate]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("erp-theme", theme);
  }, [theme]);

  const handleLogin = async () => {
    const safeEmail = email.trim();
    const safePassword = password.trim();

    if (!safeEmail || !safePassword) {
      setErrorMessage("Email and password are required");
      return;
    }

    try {
      setErrorMessage("");
      await API.post("/auth/login", {
        email: safeEmail,
        password: safePassword,
      });

      navigate("/dashboard");
    } catch (error) {
      setErrorMessage(error?.response?.data?.message || "Login failed");
      console.error(error);
    }
  };

  return (
    <div className={styles.container}>
      <button
        type="button"
        className={styles.themeBtn}
        onClick={() => setTheme((prev) => (prev === "dark" ? "light" : "dark"))}
        aria-label="Toggle theme"
        title="Toggle theme"
      >
        {theme === "dark" ? <FaSun /> : <FaMoon />}
        <span className={styles.themeBtnText}>{theme === "dark" ? "Light" : "Dark"}</span>
      </button>

      <div className={styles.card}>
        <div className={styles.title}>Login to Textile ERP</div>

        <input
          type="email"
          className={styles.input}
          placeholder="Email"
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          className={styles.input}
          placeholder="Password"
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button
          className={styles.button}
          onClick={handleLogin}
          disabled={!email.trim() || !password.trim()}
        >
          Login
        </button>

        {errorMessage && <p className={styles.error}>{errorMessage}</p>}
      </div>
    </div>
  );
};

export default Login;
