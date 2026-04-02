import { useCallback, useEffect, useState } from "react";
import { dashboardApi, ApiError } from "../api.js";

function money(n) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(n);
}

export function Dashboard() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [trend, setTrend] = useState("monthly");
  const [summary, setSummary] = useState(null);
  const [recent, setRecent] = useState([]);
  const [trends, setTrends] = useState([]);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setErr("");
    setLoading(true);
    const params = {};
    if (from) params.from = new Date(from).toISOString();
    if (to) params.to = new Date(to).toISOString();
    try {
      const [s, r, t] = await Promise.all([
        dashboardApi.summary(params),
        dashboardApi.recent(params),
        dashboardApi.trends({ ...params, trend }),
      ]);
      setSummary(s);
      setRecent(r.recent ?? []);
      setTrends(t.series ?? []);
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }, [from, to, trend]);

  useEffect(() => {
    load();
  }, [load]);

  const maxBar = Math.max(
    ...trends.flatMap((b) => [b.income, b.expense]),
    1
  );

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h2>Overview</h2>
          <p className="muted">Income, expenses, and trends for the selected period.</p>
        </div>
        <div className="toolbar">
          <label className="field inline">
            <span className="sr-only">From</span>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </label>
          <label className="field inline">
            <span className="sr-only">To</span>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </label>
          <select
            className="select"
            value={trend}
            onChange={(e) => setTrend(e.target.value)}
            aria-label="Trend grouping"
          >
            <option value="monthly">Monthly trend</option>
            <option value="weekly">Weekly trend</option>
          </select>
          <button type="button" className="btn secondary" onClick={load} disabled={loading}>
            Refresh
          </button>
        </div>
      </header>

      {err && <p className="banner error">{err}</p>}

      {loading && !summary ? (
        <div className="app-loading">
          <div className="spinner" />
        </div>
      ) : (
        <>
          <section className="grid kpis">
            <article className="card kpi">
              <h3>Income</h3>
              <p className="kpi-value income">{money(summary?.totals?.totalIncome ?? 0)}</p>
            </article>
            <article className="card kpi">
              <h3>Expenses</h3>
              <p className="kpi-value expense">{money(summary?.totals?.totalExpense ?? 0)}</p>
            </article>
            <article className="card kpi">
              <h3>Net</h3>
              <p
                className={`kpi-value ${
                  (summary?.totals?.netBalance ?? 0) >= 0 ? "income" : "expense"
                }`}
              >
                {money(summary?.totals?.netBalance ?? 0)}
              </p>
            </article>
          </section>

          <section className="grid two-col">
            <article className="card">
              <h3>Trend</h3>
              <div className="chart" role="img" aria-label="Income and expense by period">
                {trends.length === 0 ? (
                  <p className="muted">No data in range.</p>
                ) : (
                  <ul className="bar-chart">
                    {trends.map((b) => (
                      <li key={b.period}>
                        <div className="bar-meta">
                          <span className="mono">{b.period}</span>
                          <span className="muted small">
                            Net {money(b.net)}{" "}
                          </span>
                        </div>
                        <div className="bar-row">
                          <div
                            className="bar income"
                            style={{ width: `${(b.income / maxBar) * 100}%` }}
                            title={`Income ${money(b.income)}`}
                          />
                        </div>
                        <div className="bar-row">
                          <div
                            className="bar expense"
                            style={{ width: `${(b.expense / maxBar) * 100}%` }}
                            title={`Expense ${money(b.expense)}`}
                          />
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </article>

            <article className="card">
              <h3>Recent activity</h3>
              <ul className="list">
                {recent.length === 0 ? (
                  <li className="muted">Nothing to show.</li>
                ) : (
                  recent.map((r) => (
                    <li key={r.id} className="list-item">
                      <div>
                        <strong>{r.category}</strong>
                        <span className="muted small">
                          {" "}
                          · {new Date(r.date).toLocaleDateString()}
                        </span>
                        {r.notes && <p className="small muted truncate">{r.notes}</p>}
                      </div>
                      <span className={`mono amt ${r.type === "INCOME" ? "income" : "expense"}`}>
                        {r.type === "INCOME" ? "+" : "−"}
                        {money(r.amount)}
                      </span>
                    </li>
                  ))
                )}
              </ul>
            </article>
          </section>

          <section className="card">
            <h3>By category</h3>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Category</th>
                    <th className="num">Income</th>
                    <th className="num">Expense</th>
                    <th className="num">Net</th>
                  </tr>
                </thead>
                <tbody>
                  {(summary?.categoryBreakdown ?? []).length === 0 ? (
                    <tr>
                      <td colSpan={4} className="muted">
                        No rows in this period.
                      </td>
                    </tr>
                  ) : (
                    summary.categoryBreakdown.map((c) => (
                      <tr key={c.category}>
                        <td>{c.category}</td>
                        <td className="num income">{money(c.income)}</td>
                        <td className="num expense">{money(c.expense)}</td>
                        <td className="num">{money(c.net)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
