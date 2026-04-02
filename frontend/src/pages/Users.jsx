import { useCallback, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { ApiError, usersApi } from "../api.js";

const roles = [
  { value: "VIEWER", label: "Viewer" },
  { value: "ANALYST", label: "Analyst" },
  { value: "ADMIN", label: "Admin" },
];

export function Users() {
  const { isAdmin, user: me } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [modal, setModal] = useState({ mode: null, user: null });
  const [form, setForm] = useState({
    email: "",
    password: "",
    name: "",
    role: "VIEWER",
    status: "ACTIVE",
  });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setErr("");
    setLoading(true);
    try {
      const res = await usersApi.list();
      setUsers(res.users ?? []);
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  function openCreate() {
    setForm({
      email: "",
      password: "",
      name: "",
      role: "VIEWER",
      status: "ACTIVE",
    });
    setModal({ mode: "create", user: null });
  }

  function openEdit(u) {
    setForm({
      email: u.email,
      password: "",
      name: u.name,
      role: u.role,
      status: u.status,
    });
    setModal({ mode: "edit", user: u });
  }

  async function submitForm(e) {
    e.preventDefault();
    setSaving(true);
    setErr("");
    try {
      if (modal.mode === "create") {
        await usersApi.create({
          email: form.email.trim(),
          password: form.password,
          name: form.name.trim(),
          role: form.role,
          status: form.status,
        });
      } else if (modal.user) {
        const patch = {
          email: form.email.trim(),
          name: form.name.trim(),
          role: form.role,
          status: form.status,
        };
        if (form.password) patch.password = form.password;
        await usersApi.update(modal.user.id, patch);
      }
      setModal({ mode: null, user: null });
      await load();
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete(target) {
    if (!target || target.id === me?.id) return;
    setSaving(true);
    setErr("");
    try {
      await usersApi.remove(target.id);
      setModal({ mode: null, user: null });
      await load();
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "Delete failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h2>Users</h2>
          <p className="muted">Create accounts, assign roles, and set active status.</p>
        </div>
        <button type="button" className="btn primary" onClick={openCreate}>
          Add user
        </button>
      </header>

      {err && <p className="banner error">{err}</p>}

      <section className="card">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="muted">
                    Loading…
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id}>
                    <td>{u.name}</td>
                    <td className="mono">{u.email}</td>
                    <td>
                      <span className={`role-pill role-${u.role.toLowerCase()}`}>{u.role}</span>
                    </td>
                    <td>
                      <span className={`pill status-${u.status.toLowerCase()}`}>{u.status}</span>
                    </td>
                    <td className="actions">
                      <button type="button" className="btn link" onClick={() => openEdit(u)}>
                        Edit
                      </button>
                      <button
                        type="button"
                        className="btn link danger"
                        disabled={u.id === me?.id}
                        onClick={() => setModal({ mode: "delete", user: u })}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {(modal.mode === "create" || modal.mode === "edit") && (
        <div
          className="modal-backdrop"
          role="presentation"
          onClick={() => !saving && setModal({ mode: null, user: null })}
        >
          <div
            className="modal card"
            role="dialog"
            aria-modal
            onClick={(e) => e.stopPropagation()}
          >
            <h3>{modal.mode === "create" ? "New user" : "Edit user"}</h3>
            <form className="stack gap-md" onSubmit={submitForm}>
              <label className="field">
                <span>Name</span>
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  required
                />
              </label>
              <label className="field">
                <span>Email</span>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  required
                />
              </label>
              <label className="field">
                <span>{modal.mode === "create" ? "Password" : "New password (optional)"}</span>
                <input
                  type="password"
                  minLength={modal.mode === "create" ? 8 : undefined}
                  required={modal.mode === "create"}
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  placeholder={modal.mode === "edit" ? "Leave blank to keep" : ""}
                />
              </label>
              <label className="field">
                <span>Role</span>
                <select
                  value={form.role}
                  onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                >
                  {roles.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Status</span>
                <select
                  value={form.status}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </label>
              <div className="row end gap-sm">
                <button
                  type="button"
                  className="btn ghost"
                  onClick={() => setModal({ mode: null, user: null })}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button type="submit" className="btn primary" disabled={saving}>
                  {saving ? "Saving…" : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modal.mode === "delete" && modal.user && (
        <div
          className="modal-backdrop"
          role="presentation"
          onClick={() => !saving && setModal({ mode: null, user: null })}
        >
          <div
            className="modal card narrow"
            role="dialog"
            aria-modal
            onClick={(e) => e.stopPropagation()}
          >
            <h3>Delete user?</h3>
            <p className="muted">
              Remove <strong>{modal.user.email}</strong> permanently?
            </p>
            <div className="row end gap-sm">
              <button
                type="button"
                className="btn ghost"
                onClick={() => setModal({ mode: null, user: null })}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn danger"
                onClick={() => confirmDelete(modal.user)}
                disabled={saving}
              >
                {saving ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
