import { useState } from "react";
import { useEffect } from "react";
import API from "../../api/axios";
import { useNavigate } from "react-router-dom";
import styles from "./Login.module.css";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
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

  const handleLogin = async () => {
    try {
      setErrorMessage("");
      await API.post("/auth/login", {
        email,
        password,
      });

      navigate("/dashboard");
    } catch (error) {
      setErrorMessage(error?.response?.data?.message || "Login failed");
      console.error(error);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.title}>Login to Textile ERP</div>

        <input
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

        <button className={styles.button} onClick={handleLogin}>
          Login
        </button>

        {errorMessage && <p className={styles.error}>{errorMessage}</p>}
      </div>
    </div>
  );
};

export default Login;
