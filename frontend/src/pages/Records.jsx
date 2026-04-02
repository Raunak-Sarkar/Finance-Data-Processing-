import { useCallback, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { ApiError, recordsApi } from "../api.js";

function money(n) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(n);
}

const emptyForm = {
  amount: "",
  type: "EXPENSE",
  category: "",
  date: new Date().toISOString().slice(0, 10),
  notes: "",
};

export function Records() {
  const { isAnalyst } = useAuth();
  const [filters, setFilters] = useState({
    type: "",
    category: "",
    from: "",
    to: "",
    search: "",
    page: 1,
    pageSize: 10,
  });
  const [data, setData] = useState({ items: [], total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [modal, setModal] = useState({ mode: null, record: null });
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setErr("");
    setLoading(true);
    try {
      const q = {
        page: filters.page,
        pageSize: filters.pageSize,
      };
      if (filters.type) q.type = filters.type;
      if (filters.category) q.category = filters.category;
      if (filters.from) q.from = new Date(filters.from).toISOString();
      if (filters.to) q.to = new Date(filters.to).toISOString();
      if (filters.search) q.search = filters.search;
      const res = await recordsApi.list(q);
      setData(res);
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "Failed to load records");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    load();
  }, [load]);

  if (!isAnalyst) {
    return <Navigate to="/" replace />;
  }

  function openCreate() {
    setForm(emptyForm);
    setModal({ mode: "create", record: null });
  }

  function openEdit(record) {
    setForm({
      amount: String(record.amount),
      type: record.type,
      category: record.category,
      date: new Date(record.date).toISOString().slice(0, 10),
      notes: record.notes ?? "",
    });
    setModal({ mode: "edit", record });
  }

  async function submitForm(e) {
    e.preventDefault();
    setSaving(true);
    setErr("");
    try {
      const body = {
        amount: Number(form.amount),
        type: form.type,
        category: form.category,
        date: new Date(form.date).toISOString(),
        notes: form.notes || null,
      };
      if (modal.mode === "create") {
        await recordsApi.create(body);
      } else if (modal.record) {
        await recordsApi.update(modal.record.id, body);
      }
      setModal({ mode: null, record: null });
      await load();
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!modal.record) return;
    setSaving(true);
    setErr("");
    try {
      await recordsApi.remove(modal.record.id);
      setModal({ mode: null, record: null });
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
          <h2>Financial records</h2>
          <p className="muted">Filter, add, and edit entries (Analyst &amp; Admin).</p>
        </div>
        <button type="button" className="btn primary" onClick={openCreate}>
          Add record
        </button>
      </header>

      {err && <p className="banner error">{err}</p>}

      <section className="card filters">
        <div className="toolbar wrap">
          <select
            className="select"
            value={filters.type}
            onChange={(e) => setFilters((f) => ({ ...f, type: e.target.value, page: 1 }))}
            aria-label="Type"
          >
            <option value="">All types</option>
            <option value="INCOME">Income</option>
            <option value="EXPENSE">Expense</option>
          </select>
          <input
            type="text"
            className="input"
            placeholder="Category"
            value={filters.category}
            onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value, page: 1 }))}
          />
          <input
            type="date"
            value={filters.from}
            onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value, page: 1 }))}
            aria-label="From"
          />
          <input
            type="date"
            value={filters.to}
            onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value, page: 1 }))}
            aria-label="To"
          />
          <input
            type="search"
            className="input grow"
            placeholder="Search notes / category"
            value={filters.search}
            onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value, page: 1 }))}
          />
          <button type="button" className="btn secondary" onClick={load} disabled={loading}>
            Apply
          </button>
        </div>
      </section>

      <section className="card">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Category</th>
                <th className="num">Amount</th>
                <th>Notes</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="muted">
                    Loading…
                  </td>
                </tr>
              ) : data.items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="muted">
                    No records match.
                  </td>
                </tr>
              ) : (
                data.items.map((r) => (
                  <tr key={r.id}>
                    <td>{new Date(r.date).toLocaleDateString()}</td>
                    <td>
                      <span className={`pill type-${r.type.toLowerCase()}`}>{r.type}</span>
                    </td>
                    <td>{r.category}</td>
                    <td className="num mono">{money(r.amount)}</td>
                    <td className="truncate max-xs">{r.notes ?? "—"}</td>
                    <td className="actions">
                      <button type="button" className="btn link" onClick={() => openEdit(r)}>
                        Edit
                      </button>
                      <button
                        type="button"
                        className="btn link danger"
                        onClick={() => setModal({ mode: "delete", record: r })}
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

        <div className="pager">
          <button
            type="button"
            className="btn secondary"
            disabled={filters.page <= 1 || loading}
            onClick={() => setFilters((f) => ({ ...f, page: Math.max(1, f.page - 1) }))}
          >
            Previous
          </button>
          <span className="muted small">
            Page {filters.page} of {data.totalPages} ({data.total} rows)
          </span>
          <button
            type="button"
            className="btn secondary"
            disabled={filters.page >= data.totalPages || loading}
            onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))}
          >
            Next
          </button>
        </div>
      </section>

      {(modal.mode === "create" || modal.mode === "edit") && (
        <div className="modal-backdrop" role="presentation" onClick={() => !saving && setModal({ mode: null, record: null })}>
          <div className="modal card" role="dialog" aria-modal onClick={(e) => e.stopPropagation()}>
            <h3>{modal.mode === "create" ? "New record" : "Edit record"}</h3>
            <form className="stack gap-md" onSubmit={submitForm}>
              <label className="field">
                <span>Amount</span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={form.amount}
                  onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                />
              </label>
              <label className="field">
                <span>Type</span>
                <select
                  value={form.type}
                  onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                >
                  <option value="INCOME">Income</option>
                  <option value="EXPENSE">Expense</option>
                </select>
              </label>
              <label className="field">
                <span>Category</span>
                <input
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  required
                />
              </label>
              <label className="field">
                <span>Date</span>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                  required
                />
              </label>
              <label className="field">
                <span>Notes</span>
                <textarea
                  rows={3}
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                />
              </label>
              <div className="row end gap-sm">
                <button type="button" className="btn ghost" onClick={() => setModal({ mode: null, record: null })} disabled={saving}>
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

      {modal.mode === "delete" && modal.record && (
        <div className="modal-backdrop" role="presentation" onClick={() => !saving && setModal({ mode: null, record: null })}>
          <div className="modal card narrow" role="dialog" aria-modal onClick={(e) => e.stopPropagation()}>
            <h3>Delete record?</h3>
            <p className="muted">
              This soft-deletes{" "}
              <strong>{modal.record.category}</strong> · {money(modal.record.amount)}.
            </p>
            <div className="row end gap-sm">
              <button type="button" className="btn ghost" onClick={() => setModal({ mode: null, record: null })} disabled={saving}>
                Cancel
              </button>
              <button type="button" className="btn danger" onClick={confirmDelete} disabled={saving}>
                {saving ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
