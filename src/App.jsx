import React, { useEffect, useState } from "react";
import api, { getApiErrorMessage } from "./api";

const allNavigation = [
  ["dashboard", "Dashboard", "▦"],
  ["employees", "Employees", "♙"],
  ["attendance", "Attendance", "◷"],
  ["leaves", "Leave requests", "▤"],
  ["payroll", "Payroll", "₹"],
  ["performance", "Performance", "★"],
];
const employeeNavigation = allNavigation.filter(([id]) => ["dashboard", "leaves"].includes(id));
const hrRoles = ["ADMIN", "HR"];

const pageSettings = {
  employees: {
    title: "Employees",
    fields: [
      ["name", "Full name", "text", true],
      ["email", "Email", "email", true],
      ["password", "Password (leave blank to keep current)", "password"],
      ["phone", "Phone", "tel"],
      ["department", "Department", "text"],
      ["jobTitle", "Job title", "text"],
      ["joiningDate", "Joining date", "date"],
      ["role", "Role", "select", true, ["EMPLOYEE", "HR"]],
      ["salary", "Salary", "number"],
    ],
    columns: [["name", "Name"], ["email", "Email"], ["department", "Department"], ["jobTitle", "Job title"], ["role", "Role"], ["salary", "Salary"]],
    create: true,
    edit: true,
    remove: true,
  },
  attendance: {
    title: "Attendance",
    fields: [
      ["employeeId", "Employee", "employee", true],
      ["date", "Date", "date", true],
      ["present", "Attendance", "select", true, ["true", "false"]],
    ],
    columns: [["employee", "Employee"], ["date", "Date"], ["status", "Status"], ["present", "Present"]],
    create: true,
    remove: true,
  },
  leaves: {
    title: "Leave requests",
    fields: [
      ["fromDate", "From date", "date", true],
      ["toDate", "To date", "date", true],
      ["reason", "Reason", "textarea", true],
    ],
    columns: [["employee", "Employee"], ["fromDate", "From"], ["toDate", "To"], ["reason", "Reason"], ["status", "Status"], ["reviewerComment", "HR comment"]],
    create: true,
  },
  payroll: {
    title: "Payroll",
    fields: [
      ["employeeId", "Employee", "employee", true],
      ["month", "Month", "month", true],
      ["basicSalary", "Basic salary", "number", true],
      ["allowances", "Allowances", "number"],
      ["deductions", "Deductions", "number"],
    ],
    columns: [["employee", "Employee"], ["month", "Month"], ["basicSalary", "Basic salary"], ["allowances", "Allowances"], ["deductions", "Deductions"], ["netSalary", "Net salary"]],
    create: true,
  },
  performance: {
    title: "Performance",
    fields: [
      ["employeeId", "Employee", "employee", true],
      ["reviewDate", "Review date", "date", true],
      ["rating", "Rating (1-5)", "number", true],
      ["goals", "Goals", "textarea"],
      ["feedback", "Feedback", "textarea"],
    ],
    columns: [["employee", "Employee"], ["reviewDate", "Review date"], ["rating", "Rating"], ["goals", "Goals"], ["feedback", "Feedback"]],
    create: true,
  },
};

function Login({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [role, setRole] = useState("HR");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("admin@smarthr.com");
  const [password, setPassword] = useState("Admin@123");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (mode === "register") {
        await api.post("/auth/register", { name, email, password });
        setMode("login");
        setRole("EMPLOYEE");
        setPassword("");
        setError("Account created. Sign in with your employee account.");
        return;
      }

      const response = await api.post("/auth/login", { email, password, role });
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.user));
      onLogin(response.data.user);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "Sign-in failed. Please check your account and try again."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login">
      <div className="login-card">
        <Brand />
        <h1>{mode === "login" ? "Welcome back" : "Create employee account"}</h1>
        <p>{mode === "login" ? "Sign in to manage your workforce." : "Register to access your employee portal."}</p>
        <form onSubmit={submit}>
          {mode === "register" && (
            <label>Full name<input autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} required /></label>
          )}
          {mode === "login" && (
            <label>
              Sign in as
              <select value={role} onChange={(event) => setRole(event.target.value)}>
                <option value="HR">HR / Administrator</option>
                <option value="EMPLOYEE">Employee</option>
              </select>
            </label>
          )}
          <label>Email<input type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
          <label>Password<input type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} value={password} onChange={(event) => setPassword(event.target.value)} minLength={6} required /></label>
          {error && <div className={error.startsWith("Account created") ? "notice" : "error"} role="status">{error}</div>}
          <button disabled={busy}>{busy ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}</button>
        </form>
        <button className="text-button" type="button" onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}>
          {mode === "login" ? "New employee? Create an account" : "Already registered? Sign in"}
        </button>
        {mode === "login" && <div className="hint">Demo HR account: admin@smarthr.com / Admin@123</div>}
      </div>
    </div>
  );
}

function Brand() {
  return <div className="brand"><span>SH</span><div><b>Smart HR</b><small>Management System</small></div></div>;
}

function App() {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("user") || "null"); } catch { return null; }
  });
  const [page, setPage] = useState("dashboard");
  const navigation = user && hrRoles.includes(user.role) ? allNavigation : employeeNavigation;

  useEffect(() => {
    const expire = () => { setUser(null); setPage("dashboard"); };
    window.addEventListener("session-expired", expire);
    return () => window.removeEventListener("session-expired", expire);
  }, []);

  useEffect(() => {
    if (user && !navigation.some(([id]) => id === page)) setPage("dashboard");
  }, [user, page, navigation]);

  if (!user) return <Login onLogin={setUser} />;
  const signOut = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setPage("dashboard");
  };

  return (
    <div className="app">
      <aside>
        <Brand />
        <nav aria-label="Main navigation">
          {navigation.map(([id, label, icon]) => (
            <button className={page === id ? "active" : ""} onClick={() => setPage(id)} key={id}>
              <i>{icon}</i>{label}
            </button>
          ))}
        </nav>
        <div className="side-bottom">
          <small>Signed in as</small><b>{user.name}</b><span>{user.role}</span>
          <button onClick={signOut}>↪ Sign out</button>
        </div>
      </aside>
      <main>
        <header>
          <div><h2>{navigation.find(([id]) => id === page)?.[1]}</h2><span>Smart HR Management System</span></div>
          <div className="avatar" aria-label={user.name}>{user.name?.[0]?.toUpperCase() || "U"}</div>
        </header>
        <section className="content">
          {page === "dashboard"
            ? <Dashboard user={user} onNavigate={setPage} />
            : <DataPage key={`${page}-${user.id}`} type={page} user={user} />}
        </section>
      </main>
    </div>
  );
}

function Dashboard({ user, onNavigate }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    api.get("/dashboard").then((response) => setData(response.data))
      .catch((requestError) => setError(getApiErrorMessage(requestError, "Unable to load dashboard.")));
  }, []);

  const employee = !hrRoles.includes(user.role);
  const cards = employee
    ? [["My attendance", data?.attendanceRecords ?? "—", "My attendance records"], ["My leave requests", data?.leaveRequests ?? "—", "Requests submitted"]]
    : [["Employees", data?.employees ?? "—", "Total workforce"], ["Attendance", data?.attendanceRecords ?? "—", "Attendance records"], ["Leave requests", data?.leaveRequests ?? "—", "Requests submitted"], ["Payroll", data?.payrollRecords ?? "—", "Payroll records"], ["Performance", data?.performanceReviews ?? "—", "Reviews completed"]];
  const actions = employee ? [["leaves", "Leave requests", "Submit and track your leave"]] : allNavigation.slice(1).map(([id, label]) => [id, label, `Manage ${label.toLowerCase()}`]);
  return <>
    <div className="welcome"><div><h1>Hello, {user.name} 👋</h1><p>{employee ? "Your employee workspace." : "Here’s your HR overview for today."}</p></div><div className="date">{new Date().toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}</div></div>
    {error && <div className="error" role="alert">{error}</div>}
    <div className={`cards ${employee ? "employee-cards" : ""}`}>{cards.map(([label, value, caption]) => <div className="card" key={label}><span>{label}</span><strong>{value}</strong><small>{caption}</small></div>)}</div>
    <div className="panel"><div className="panel-head"><div><h3>{employee ? "Employee self-service" : "HR operations"}</h3><p>Select a section to continue.</p></div></div>
      <div className="ops">{actions.map(([id, label, detail]) => <button key={id} onClick={() => onNavigate(id)}><b>{allNavigation.find(([navId]) => navId === id)?.[2] || "▤"}</b><span>{label}</span><small>{detail}</small></button>)}</div>
    </div>
  </>;
}

function DataPage({ type, user }) {
  const settings = pageSettings[type];
  const isHr = hrRoles.includes(user.role);
  const canCreate = settings.create && (type !== "leaves" || !isHr);
  const [rows, setRows] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dialog, setDialog] = useState(null);

  async function loadRows() {
    setLoading(true);
    setError("");
    try {
      const response = await api.get(`/${type}`);
      setRows(response.data);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, `Unable to load ${settings.title.toLowerCase()}.`));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadRows(); }, [type]);

  async function openCreate() {
    setError("");
    if (settings.fields.some(([, , inputType]) => inputType === "employee")) {
      try {
        const response = await api.get("/employees");
        setEmployees(response.data);
      } catch (requestError) {
        setError(getApiErrorMessage(requestError, "Unable to load employees for this form."));
        return;
      }
    }
    setDialog({ mode: "create", values: {} });
  }

  async function submit(values) {
    const payload = { ...values };
    if (payload.employeeId !== undefined) payload.employeeId = Number(payload.employeeId);
    if (payload.salary !== undefined) payload.salary = Number(payload.salary);
    if (payload.basicSalary !== undefined) payload.basicSalary = Number(payload.basicSalary);
    if (payload.allowances !== undefined) payload.allowances = Number(payload.allowances || 0);
    if (payload.deductions !== undefined) payload.deductions = Number(payload.deductions || 0);
    if (payload.rating !== undefined) payload.rating = Number(payload.rating);
    if (payload.present !== undefined) payload.present = payload.present === "true" || payload.present === true;
    if (payload.role) payload.role = payload.role.toUpperCase();
    if (type === "employees" && !payload.password) delete payload.password;
    try {
      if (dialog.mode === "edit") await api.put(`/employees/${dialog.values.id}`, payload);
      else await api.post(`/${type}`, payload);
      setDialog(null);
      await loadRows();
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "The change could not be saved. Please check the form and try again."));
      throw requestError;
    }
  }

  async function remove(row) {
    if (!window.confirm(`Delete ${type === "employees" ? row.name : `${settings.title.toLowerCase()} record #${row.id}`}? This cannot be undone.`)) return;
    try {
      await api.delete(`/${type}/${row.id}`);
      await loadRows();
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "Unable to delete this record."));
    }
  }

  async function review(values) {
    try {
      await api.put(`/leaves/${dialog.values.id}/status`, values);
      setDialog(null);
      await loadRows();
    } catch (requestError) {
      setError(getApiErrorMessage(requestError, "Unable to update this leave request."));
      throw requestError;
    }
  }

  return <div className="panel">
    <div className="panel-head">
      <div><h3>{settings.title}</h3><p>{type === "leaves" && isHr ? "Review employee requests and record a decision." : `View and manage ${settings.title.toLowerCase()}.`}</p></div>
      {canCreate && <button className="primary" onClick={openCreate}>+ {type === "leaves" ? "Request leave" : `Add ${settings.title.replace(/s$/, "")}`}</button>}
    </div>
    {error && <div className="error page-error" role="alert">{error}</div>}
    {loading ? <p className="loading">Loading…</p> : rows.length === 0 ? <div className="empty">No {settings.title.toLowerCase()} yet.</div> :
      <div className="table-wrap"><table><thead><tr>{settings.columns.map(([, label]) => <th key={label}>{label}</th>)}{(settings.edit || settings.remove || (type === "leaves" && isHr)) && <th>Actions</th>}</tr></thead>
        <tbody>{rows.map((row) => <tr key={row.id}>{settings.columns.map(([key, label]) => <td key={label}>{formatValue(row[key])}</td>)}
          {(settings.edit || settings.remove || (type === "leaves" && isHr)) && <td className="row-actions">
            {settings.edit && <button className="small-button" onClick={() => setDialog({ mode: "edit", values: { ...row, password: "" } })}>Edit</button>}
            {settings.remove && <button className="small-button danger-button" onClick={() => remove(row)}>Delete</button>}
            {type === "leaves" && isHr && row.status === "PENDING" && <button className="small-button" onClick={() => setDialog({ mode: "review", values: row })}>Review</button>}
          </td>}
        </tr>)}</tbody></table></div>}
    {dialog?.mode === "review"
      ? <ReviewDialog request={dialog.values} onClose={() => setDialog(null)} onSubmit={review} />
      : dialog && <RecordDialog settings={settings} mode={dialog.mode} values={dialog.values} employees={employees} onClose={() => setDialog(null)} onSubmit={submit} />}
  </div>;
}

function formatValue(value) {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "object") return value.name || value.status || "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value);
}

function RecordDialog({ settings, mode, values, employees, onClose, onSubmit }) {
  const [form, setForm] = useState(() => {
    const initial = { ...values };
    settings.fields.forEach(([key, , inputType]) => {
      if (inputType === "employee" && initial[key] == null && initial.employee?.id) initial[key] = initial.employee.id;
      if (inputType === "select" && key === "present" && typeof initial[key] === "boolean") initial[key] = String(initial[key]);
    });
    return initial;
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try { await onSubmit(form); } catch (requestError) { setError(getApiErrorMessage(requestError, "Unable to save changes.")); } finally { setBusy(false); }
  }
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title">
      <div className="dialog-head"><h3 id="dialog-title">{mode === "edit" ? "Edit" : "Add"} {settings.title.replace(/s$/, "")}</h3><button className="icon-button" type="button" aria-label="Close" onClick={onClose}>×</button></div>
      <form onSubmit={submit} className="record-form">
        {settings.fields.map(([key, label, inputType, required, options]) => {
          if (mode === "edit" && key === "password") return null;
          return <label key={key}>{label}
            {inputType === "textarea" ? <textarea value={form[key] ?? ""} onChange={(event) => setForm({ ...form, [key]: event.target.value })} required={required} rows="3" /> :
              inputType === "employee" ? <select required value={form[key] ?? ""} onChange={(event) => setForm({ ...form, [key]: event.target.value })}><option value="">Select an employee</option>{employees.map((employee) => <option value={employee.id} key={employee.id}>{employee.name} ({employee.email})</option>)}</select> :
                inputType === "select" ? <select required={required} value={form[key] ?? (key === "present" ? "true" : options[0])} onChange={(event) => setForm({ ...form, [key]: event.target.value })}>{options.map((option) => <option key={option} value={option}>{key === "present" ? option === "true" ? "Present" : "Absent" : option}</option>)}</select> :
                  <input type={inputType} min={key === "rating" ? "1" : undefined} max={key === "rating" ? "5" : undefined} step={inputType === "number" ? "0.01" : undefined} value={form[key] ?? ""} onChange={(event) => setForm({ ...form, [key]: event.target.value })} required={required} />}
          </label>;
        })}
        {error && <div className="error" role="alert">{error}</div>}
        <div className="dialog-actions"><button type="button" className="secondary" onClick={onClose}>Cancel</button><button className="primary" disabled={busy}>{busy ? "Saving…" : "Save"}</button></div>
      </form>
    </section>
  </div>;
}

function ReviewDialog({ request, onClose, onSubmit }) {
  const [status, setStatus] = useState("APPROVED");
  const [reviewerComment, setReviewerComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="dialog" role="dialog" aria-modal="true" aria-labelledby="review-title">
      <div className="dialog-head"><h3 id="review-title">Review leave request</h3><button className="icon-button" type="button" aria-label="Close" onClick={onClose}>×</button></div>
      <p className="review-summary"><b>{request.employee?.name}</b> · {request.fromDate} to {request.toDate}<br />{request.reason}</p>
      <form className="record-form" onSubmit={async (event) => { event.preventDefault(); setBusy(true); setError(""); try { await onSubmit({ status, reviewerComment }); } catch (requestError) { setError(getApiErrorMessage(requestError, "Unable to save the review.")); } finally { setBusy(false); } }}>
        <label>Decision<select value={status} onChange={(event) => setStatus(event.target.value)}><option value="APPROVED">Approve</option><option value="REJECTED">Reject</option></select></label>
        <label>Comment<textarea rows="3" value={reviewerComment} onChange={(event) => setReviewerComment(event.target.value)} /></label>
        {error && <div className="error" role="alert">{error}</div>}
        <div className="dialog-actions"><button type="button" className="secondary" onClick={onClose}>Cancel</button><button className="primary" disabled={busy}>{busy ? "Saving…" : "Save decision"}</button></div>
      </form>
    </section>
  </div>;
}

export default App;
