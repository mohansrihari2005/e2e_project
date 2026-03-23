import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { apiClient } from "../services/api";

export default function Login() {
  const auth = useAuth();
  const [role, setRole] = useState("user");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const demo = {
    user: { email: "user@gmail.com", password: "user123" },
    admin: { email: "admin@1223", password: "admim123" }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const data = await apiClient.login(email, password);
      
      // Store in auth context
      auth.signIn({
        token: data.token,
        role: data.role,
        name: data.name,
        email: data.email
      });
      
      navigate(data.role === "admin" ? "/admin" : "/user");
    } catch (err) {
      setError(err.message || "Unable to reach the server");
      console.error("Login error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="hero">
      <form className="glass login-panel" onSubmit={handleSubmit}>
        <h1>AI Complaint Command Center</h1>
        <p>Enterprise-grade complaint intake, resolution, and analytics.</p>
        <label>Login as</label>
        <select value={role} onChange={(event) => setRole(event.target.value)}>
          <option value="user">Customer</option>
          <option value="admin">Admin</option>
        </select>
        <button
          type="button"
          className="secondary-btn"
          onClick={() => {
            setEmail(demo[role].email);
            setPassword(demo[role].password);
          }}
          disabled={isLoading}
        >
          Use demo credentials
        </button>
        <label>Email address</label>
        <input 
          value={email} 
          onChange={(event) => setEmail(event.target.value)} 
          disabled={isLoading}
          required 
        />
        <label>Password</label>
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          disabled={isLoading}
          required
        />
        <button className="primary-btn" type="submit" disabled={isLoading}>
          {isLoading ? "Signing in..." : "Secure Sign In"}
        </button>
        {error && <p style={{ color: "#fda4af" }}>{error}</p>}
      </form>
    </div>
  );
}
