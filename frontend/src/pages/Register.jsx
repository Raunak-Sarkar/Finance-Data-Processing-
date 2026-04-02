import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { ApiError } from "../api.js";

const ROLE_OPTIONS = [
  {
    value: "VIEWER",
    label: "Viewer",
    description: "View dashboard data only (summaries and trends).",
  },
  {
    value: "ANALYST",
    label: "Analyst",
    description: "View financial records and access insights (dashboard + record CRUD).",
  },
  {
    value: "ADMIN",
    label: "Admin",
    description: "Create, update, and manage records and users (full access).",
  },
];

export function Register() {
  const { user, register, loading } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [role, setRole] = useState("VIEWER");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (!loading && user) {
    return <Navigate to="/" replace />;
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setBusy(true);
    try {
      await register({ name: name.trim(), email: email.trim(), password, role });
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.message : err?.message || "Could not create account.";
      setError(msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card card register-card">
        <div className="brand brand-lg">
          <span className="brand-mark" aria-hidden />
          <div>
            <h1>Create account</h1>
            <p className="muted">Choose your access level, then register with your email.</p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="stack gap-md">
          <fieldset className="role-fieldset">
            <legend className="role-legend">Account type</legend>
            <div className="role-options">
              {ROLE_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className={`role-option ${role === opt.value ? "selected" : ""}`}
                >
                  <input
                    type="radio"
                    name="role"
                    value={opt.value}
                    checked={role === opt.value}
                    onChange={() => setRole(opt.value)}
                  />
                  <span className="role-option-body">
                    <span className="role-option-label">{opt.label}</span>
                    <span className="role-option-desc muted small">{opt.description}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <label className="field">
            <span>Your name</span>
            <input
              type="text"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={200}
              placeholder="Jane Doe"
            />
          </label>
          <label className="field">
            <span>Email</span>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="name@example.com"
            />
          </label>
          <label className="field">
            <span>Password</span>
            <input
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              placeholder="At least 8 characters"
            />
          </label>
          <label className="field">
            <span>Confirm password</span>
            <input
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              minLength={8}
            />
          </label>
          {error && <p className="form-error">{error}</p>}
          <button type="submit" className="btn primary full" disabled={busy}>
            {busy ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p className="auth-switch muted small">
          Already have an account?{" "}
          <Link to="/login" className="auth-link">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
