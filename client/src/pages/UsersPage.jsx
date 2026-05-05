import { Pencil, Search, Trash2, UserPlus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { queryString } from "../api/client.js";
import Modal from "../components/Modal.jsx";
import StatusPill from "../components/StatusPill.jsx";
import { useAuth } from "../state/AuthContext.jsx";

const emptyUser = {
  name: "",
  email: "",
  password: "",
  role: "User"
};

function roleLabel(role) {
  const labels = {
    SuperAdmin: "Institution Admin",
    SubAdmin: "Campus Admin",
    User: "Teacher"
  };
  return labels[role] || role;
}

export default function UsersPage() {
  const auth = useAuth();
  const [users, setUsers] = useState([]);
  const [meta, setMeta] = useState(null);
  const [filters, setFilters] = useState({ search: "", role: "" });
  const [form, setForm] = useState(emptyUser);
  const [editingId, setEditingId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const query = useMemo(
    () =>
      queryString({
        limit: 30,
        search: filters.search,
        role: filters.role
      }),
    [filters]
  );

  async function loadUsers() {
    const payload = await auth.api(`/users${query}`);
    setUsers(payload.data);
    setMeta(payload.meta);
  }

  useEffect(() => {
    let active = true;
    async function load() {
      setError("");
      try {
        const payload = await auth.api(`/users${query}`);
        if (active) {
          setUsers(payload.data);
          setMeta(payload.meta);
        }
      } catch (err) {
        if (active) {
          setError(err.message);
        }
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [auth, query]);

  function openCreate() {
    setEditingId(null);
    setForm(emptyUser);
    setModalOpen(true);
  }

  function openEdit(user) {
    setEditingId(user.id);
    setForm({
      name: user.name,
      email: user.email,
      password: "",
      role: user.role
    });
    setModalOpen(true);
  }

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const payload = { ...form };
      if (editingId && !payload.password) {
        delete payload.password;
      }

      await auth.api(editingId ? `/users/${editingId}` : "/users", {
        method: editingId ? "PUT" : "POST",
        body: payload
      });
      setModalOpen(false);
      await loadUsers();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function remove(user) {
    if (!window.confirm(`Delete account for "${user.name}"?`)) {
      return;
    }
    setError("");
    try {
      await auth.api(`/users/${user.id}`, { method: "DELETE" });
      await loadUsers();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="stack">
      <div className="page-heading">
        <div>
          <p>Access management</p>
          <h1>Teachers & Admins</h1>
          <span className="page-heading-subtitle">Manage institutional roles used by the secure distribution workflow.</span>
        </div>
        <button className="button button-primary" type="button" onClick={openCreate}>
          <UserPlus size={17} />
          <span>New Account</span>
        </button>
      </div>

      <section className="toolbar">
        <label className="search-field">
          <Search size={17} />
          <input
            value={filters.search}
            placeholder="Search teachers and admins"
            onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
          />
        </label>
        <label>
          <span>Role</span>
          <select value={filters.role} onChange={(event) => setFilters((current) => ({ ...current, role: event.target.value }))}>
            <option value="">All</option>
            <option value="SuperAdmin">Institution Admin</option>
            <option value="SubAdmin">Campus Admin</option>
            <option value="User">Teacher</option>
          </select>
        </label>
        <span className="toolbar-count">{meta?.total ?? 0}</span>
      </section>

      {error && <div className="alert alert-error">{error}</div>}

      <section className="panel table-panel">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Created</th>
              <th aria-label="Actions" />
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>
                  <StatusPill status={user.role.toLowerCase()}>{roleLabel(user.role)}</StatusPill>
                </td>
                <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                <td>
                  <div className="table-actions">
                    <button className="icon-button" type="button" title="Edit" aria-label="Edit" onClick={() => openEdit(user)}>
                      <Pencil size={17} />
                    </button>
                    <button
                      className="icon-button danger"
                      type="button"
                      title="Delete"
                      aria-label="Delete"
                      disabled={user.id === auth.user?.id}
                      onClick={() => remove(user)}
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan="5">
                  <div className="empty-state">No accounts found.</div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      {modalOpen && (
        <Modal title={editingId ? "Edit Account" : "New Account"} onClose={() => setModalOpen(false)}>
          <form className="form-grid" onSubmit={submit}>
            <label>
              <span>Name</span>
              <input
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                required
              />
            </label>
            <label>
              <span>Email</span>
              <input
                type="email"
                value={form.email}
                onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                required
              />
            </label>
            <label>
              <span>Role</span>
              <select value={form.role} onChange={(event) => setForm((current) => ({ ...current, role: event.target.value }))}>
                <option value="SuperAdmin">Institution Admin</option>
                <option value="SubAdmin">Campus Admin</option>
                <option value="User">Teacher</option>
              </select>
            </label>
            <label>
              <span>Password</span>
              <input
                type="password"
                value={form.password}
                minLength={editingId ? undefined : 8}
                required={!editingId}
                onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
              />
            </label>
            <button className="button button-primary full" type="submit" disabled={busy}>
              {busy ? "Saving..." : "Save Account"}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
