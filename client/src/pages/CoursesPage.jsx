import { BookPlus, Pencil, RotateCcw, Search, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { queryString } from "../api/client.js";
import Modal from "../components/Modal.jsx";
import StatusPill from "../components/StatusPill.jsx";
import { useAuth } from "../state/AuthContext.jsx";

const emptyCourse = {
  title: "",
  code: "",
  isActive: true
};

export default function CoursesPage() {
  const auth = useAuth();
  const [courses, setCourses] = useState([]);
  const [meta, setMeta] = useState(null);
  const [filters, setFilters] = useState({ search: "", active: "", deleted: "false" });
  const [form, setForm] = useState(emptyCourse);
  const [editingId, setEditingId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const query = useMemo(
    () =>
      queryString({
        limit: 30,
        search: filters.search,
        active: filters.active,
        deleted: filters.deleted
      }),
    [filters]
  );

  async function loadCourses() {
    const payload = await auth.api(`/courses${query}`);
    setCourses(payload.data);
    setMeta(payload.meta);
  }

  useEffect(() => {
    let active = true;
    async function load() {
      setError("");
      try {
        const payload = await auth.api(`/courses${query}`);
        if (active) {
          setCourses(payload.data);
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
    setForm(emptyCourse);
    setModalOpen(true);
  }

  function openEdit(course) {
    setEditingId(course.id);
    setForm({
      title: course.title,
      code: course.code,
      isActive: course.isActive
    });
    setModalOpen(true);
  }

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await auth.api(editingId ? `/courses/${editingId}` : "/courses", {
        method: editingId ? "PUT" : "POST",
        body: form
      });
      setModalOpen(false);
      await loadCourses();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function softDelete(course) {
    if (!window.confirm(`Move "${course.code}" to trash?`)) {
      return;
    }
    setError("");
    try {
      await auth.api(`/courses/${course.id}`, { method: "DELETE" });
      await loadCourses();
    } catch (err) {
      setError(err.message);
    }
  }

  async function restore(course) {
    setError("");
    try {
      await auth.api(`/courses/${course.id}/restore`, { method: "PATCH" });
      await loadCourses();
    } catch (err) {
      setError(err.message);
    }
  }

  async function forceDelete(course) {
    if (!window.confirm(`Permanently delete "${course.code}"? This cannot be undone.`)) {
      return;
    }
    setError("");
    try {
      await auth.api(`/courses/${course.id}/force`, { method: "DELETE" });
      await loadCourses();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="stack">
      <div className="page-heading">
        <div>
          <p>Academic catalog</p>
          <h1>Subjects</h1>
          <span className="page-heading-subtitle">Maintain subject codes used to organize secure exam packages.</span>
        </div>
        <button className="button button-primary" type="button" onClick={openCreate}>
          <BookPlus size={17} />
          <span>New Subject</span>
        </button>
      </div>

      <section className="toolbar">
        <label className="search-field">
          <Search size={17} />
          <input
            value={filters.search}
            placeholder="Search subjects"
            onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
          />
        </label>
        <label>
          <span>Active</span>
          <select
            value={filters.active}
            onChange={(event) => setFilters((current) => ({ ...current, active: event.target.value }))}
          >
            <option value="">All</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </label>
        <label>
          <span>Trash</span>
          <select
            value={filters.deleted}
            onChange={(event) => setFilters((current) => ({ ...current, deleted: event.target.value }))}
          >
            <option value="false">Current</option>
            <option value="true">Trashed</option>
          </select>
        </label>
        <span className="toolbar-count">{meta?.total ?? 0}</span>
      </section>

      {error && <div className="alert alert-error">{error}</div>}

      <section className="panel table-panel">
        <table className="data-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Title</th>
              <th>Status</th>
              <th>Updated</th>
              <th aria-label="Actions" />
            </tr>
          </thead>
          <tbody>
            {courses.map((course) => (
              <tr key={course.id}>
                <td>{course.code}</td>
                <td>{course.title}</td>
                <td>
                  <StatusPill status={course.isActive ? "active" : "inactive"}>{course.isActive ? "Active" : "Inactive"}</StatusPill>
                </td>
                <td>{new Date(course.updatedAt).toLocaleDateString()}</td>
                <td>
                  <div className="table-actions">
                    {filters.deleted === "true" ? (
                      <>
                        <button className="icon-button" type="button" title="Restore" aria-label="Restore" onClick={() => restore(course)}>
                          <RotateCcw size={17} />
                        </button>
                        <button className="icon-button danger" type="button" title="Delete forever" aria-label="Delete forever" onClick={() => forceDelete(course)}>
                          <X size={17} />
                        </button>
                      </>
                    ) : (
                      <>
                        <button className="icon-button" type="button" title="Edit" aria-label="Edit" onClick={() => openEdit(course)}>
                          <Pencil size={17} />
                        </button>
                        <button className="icon-button danger" type="button" title="Delete" aria-label="Delete" onClick={() => softDelete(course)}>
                          <Trash2 size={17} />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {courses.length === 0 && (
              <tr>
                <td colSpan="5">
                  <div className="empty-state">No subjects found.</div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      {modalOpen && (
        <Modal title={editingId ? "Edit Subject" : "New Subject"} onClose={() => setModalOpen(false)}>
          <form className="form-grid" onSubmit={submit}>
            <label>
              <span>Code</span>
              <input
                value={form.code}
                onChange={(event) => setForm((current) => ({ ...current, code: event.target.value }))}
                required
              />
            </label>
            <label>
              <span>Title</span>
              <input
                value={form.title}
                onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                required
              />
            </label>
            <label className="toggle-row">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))}
              />
              <span>Active</span>
            </label>
            <button className="button button-primary full" type="submit" disabled={busy}>
              {busy ? "Saving..." : "Save Subject"}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
