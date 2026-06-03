import { useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { ApiError } from "../api/client";

export function Login() {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await login(username.trim(), password);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal masuk. Coba lagi.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="login-wrap">
      <form className="login-card" onSubmit={submit}>
        <div className="login-brand">
          <div className="login-logo">GP</div>
          <div>
            <h1>Dashboard Teknik</h1>
            <p>Greenpark Group — Technical Control</p>
          </div>
        </div>

        <label className="login-field">
          <span>Username</span>
          <input
            type="text"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="admin"
            autoFocus
          />
        </label>

        <label className="login-field">
          <span>Password</span>
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </label>

        {error && <div className="login-error">{error}</div>}

        <button className="login-btn" type="submit" disabled={busy || !username || !password}>
          {busy ? "Memproses…" : "Masuk"}
        </button>

        <div className="login-hint">
          Demo: <code>admin / admin123</code> atau <code>spv / spv12345</code>
        </div>
      </form>
    </div>
  );
}
