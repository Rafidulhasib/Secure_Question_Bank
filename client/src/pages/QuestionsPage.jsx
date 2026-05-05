import {
  Check,
  Eye,
  FileLock2,
  Filter,
  KeyRound,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  Upload,
  X
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { assetUrl, queryString } from "../api/client.js";
import Modal from "../components/Modal.jsx";
import StatusPill from "../components/StatusPill.jsx";
import { useAuth } from "../state/AuthContext.jsx";

const emptyForm = {
  title: "",
  courseId: "",
  isActive: true,
  accessPolicy: "standard",
  accessPassword: "",
  accessExpiresAt: "",
  allowedUserIds: [],
  question: null,
  image: null
};

function activeLabel(value) {
  return value ? "Active" : "Inactive";
}

function accessPolicyLabel(policy) {
  const labels = {
    standard: "Standard Access",
    password: "Password Protected",
    assigned: "Assigned Teachers"
  };
  return labels[policy] || "Standard Access";
}

function accessPolicyStatus(policy) {
  return policy === "password" ? "password" : policy === "assigned" ? "assigned" : "standard";
}

function dateInputValue(value) {
  if (!value) {
    return "";
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
}

export default function QuestionsPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [questions, setQuestions] = useState([]);
  const [courses, setCourses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [meta, setMeta] = useState(null);
  const [filters, setFilters] = useState({
    search: new URLSearchParams(location.search).get("search") || "",
    courseId: "",
    reviewStatus: "",
    active: "",
    deleted: "false"
  });
  const [formMode, setFormMode] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [accessPolicyTarget, setAccessPolicyTarget] = useState(null);
  const [accessTarget, setAccessTarget] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const canCreate = auth.isSubAdmin || auth.isSuperAdmin;
  const canAssignTeachers = auth.isSuperAdmin;

  useEffect(() => {
    const search = new URLSearchParams(location.search).get("search") || "";
    setFilters((current) => (current.search === search ? current : { ...current, search }));
  }, [location.search]);

  const query = useMemo(
    () =>
      queryString({
        limit: 24,
        search: filters.search,
        courseId: filters.courseId,
        reviewStatus: auth.isUser ? "" : filters.reviewStatus,
        active: auth.isUser ? "" : filters.active,
        deleted: auth.isSubAdmin ? filters.deleted : "false"
      }),
    [filters, auth.isSubAdmin, auth.isUser]
  );

  async function loadQuestions() {
    const payload = await auth.api(`/questions${query}`);
    setQuestions(payload.data);
    setMeta(payload.meta);
  }

  useEffect(() => {
    let active = true;

    async function load() {
      setError("");
      try {
        const [questionPayload, coursePayload, teacherPayload] = await Promise.all([
          auth.api(`/questions${query}`),
          auth.api("/courses?limit=50&active=true"),
          auth.isSuperAdmin ? auth.api("/users?role=User&limit=100") : Promise.resolve({ data: [] })
        ]);
        if (active) {
          setQuestions(questionPayload.data);
          setMeta(questionPayload.meta);
          setCourses(coursePayload.data);
          setTeachers(teacherPayload.data);
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

  function updateFilter(field, value) {
    setFilters((current) => ({ ...current, [field]: value }));
  }

  function openCreate() {
    setEditingId(null);
    setForm({ ...emptyForm, courseId: courses[0]?.id || "" });
    setFormMode("create");
  }

  function openEdit(question) {
    setEditingId(question.id);
    setForm({
      title: question.title,
      courseId: question.course?.id || "",
      isActive: question.isActive,
      accessPolicy: question.accessPolicy || (question.hasPassword ? "password" : "standard"),
      accessPassword: "",
      accessExpiresAt: dateInputValue(question.accessExpiresAt),
      allowedUserIds: question.allowedUsers?.map((user) => user.id) || [],
      question: null,
      image: null
    });
    setFormMode("edit");
  }

  function setFormValue(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submitForm(event) {
    event.preventDefault();
    setBusy(true);
    setError("");

    try {
      const body = new FormData();
      body.append("title", form.title);
      body.append("courseId", form.courseId);
      body.append("isActive", form.isActive ? "true" : "false");
      body.append("accessPolicy", form.accessPolicy);
      body.append("accessExpiresAt", form.accessExpiresAt);
      body.append("allowedUserIds", JSON.stringify(form.allowedUserIds));
      if (form.accessPassword) {
        body.append("accessPassword", form.accessPassword);
      }
      if (form.question) {
        body.append("question", form.question);
      }
      if (form.image) {
        body.append("image", form.image);
      }

      await auth.api(formMode === "edit" ? `/questions/${editingId}` : "/questions", {
        method: formMode === "edit" ? "PUT" : "POST",
        body
      });
      setFormMode(null);
      await loadQuestions();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function review(question, status) {
    setError("");
    try {
      await auth.api(`/questions/${question.id}/review/${status}`, { method: "PATCH" });
      await loadQuestions();
    } catch (err) {
      setError(err.message);
    }
  }

  async function remove(question) {
    if (!window.confirm(`Move "${question.title}" to trash?`)) {
      return;
    }
    setError("");
    try {
      await auth.api(`/questions/${question.id}`, { method: "DELETE" });
      await loadQuestions();
    } catch (err) {
      setError(err.message);
    }
  }

  async function restore(question) {
    setError("");
    try {
      await auth.api(`/questions/${question.id}/restore`, { method: "PATCH" });
      await loadQuestions();
    } catch (err) {
      setError(err.message);
    }
  }

  function openQuestion(question) {
    if (question.accessRequired) {
      setAccessTarget(question);
      return;
    }
    navigate(`/questions/${question.id}`);
  }

  return (
    <div className="stack">
      <div className="page-heading">
        <div>
          <p>{auth.isUser ? "Distributed to you" : auth.isSubAdmin ? "Campus workspace" : "Review desk"}</p>
          <h1>Exam Questions</h1>
          <span className="page-heading-subtitle">
            Manage secure exam packages, review state, and distribution access policy.
          </span>
        </div>
        {canCreate && (
          <button className="button button-primary" type="button" onClick={openCreate}>
            <Plus size={17} />
            <span>New Exam Package</span>
          </button>
        )}
      </div>

      <section className="toolbar">
        <label className="search-field">
          <Search size={17} />
          <input
            value={filters.search}
            placeholder="Search exam questions"
            onChange={(event) => updateFilter("search", event.target.value)}
          />
        </label>
        <label>
          <span>Subject</span>
          <select value={filters.courseId} onChange={(event) => updateFilter("courseId", event.target.value)}>
            <option value="">All subjects</option>
            {courses.map((course) => (
              <option value={course.id} key={course.id}>
                {course.code}
              </option>
            ))}
          </select>
        </label>
        {!auth.isUser && (
          <>
            <label>
              <span>Status</span>
              <select value={filters.reviewStatus} onChange={(event) => updateFilter("reviewStatus", event.target.value)}>
                <option value="">All</option>
                <option value="pending">Pending Review</option>
                <option value="selected">Approved</option>
                <option value="rejected">Needs Revision</option>
              </select>
            </label>
            <label>
              <span>Active</span>
              <select value={filters.active} onChange={(event) => updateFilter("active", event.target.value)}>
                <option value="">All</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </label>
          </>
        )}
        {auth.isSubAdmin && (
          <label>
            <span>Trash</span>
            <select value={filters.deleted} onChange={(event) => updateFilter("deleted", event.target.value)}>
              <option value="false">Current</option>
              <option value="true">Trashed</option>
            </select>
          </label>
        )}
        <span className="toolbar-count">
          <Filter size={16} />
          {meta?.total ?? 0}
        </span>
      </section>

      {error && <div className="alert alert-error">{error}</div>}

      <section className="question-grid">
        {questions.length === 0 ? (
          <div className="empty-state wide">No exam questions found.</div>
        ) : (
          questions.map((question) => (
            <article className="question-card" key={question.id}>
              <button className="question-image" type="button" onClick={() => openQuestion(question)}>
                <img src={assetUrl(question.imageFile?.url)} alt="" />
                {question.accessRequired && (
                  <span className="lock-overlay">
                    <FileLock2 size={18} />
                  </span>
                )}
              </button>
              <div className="question-body">
                <div className="question-meta">
                  <span>{question.course?.code}</span>
                  <StatusPill status={question.reviewStatus} />
                </div>
                <h2>{question.title}</h2>
                <p>{question.course?.title}</p>
                <div className="question-footer">
                  <StatusPill status={question.isActive ? "active" : "inactive"}>{activeLabel(question.isActive)}</StatusPill>
                  <StatusPill status={accessPolicyStatus(question.accessPolicy)}>
                    {accessPolicyLabel(question.accessPolicy)}
                  </StatusPill>
                  {question.isExpired && <StatusPill status="expired">Expired</StatusPill>}
                </div>
              </div>
              <div className="card-actions">
                <button className="icon-button" type="button" title="View" aria-label="View" onClick={() => openQuestion(question)}>
                  <Eye size={17} />
                </button>
                {canCreate && filters.deleted !== "true" && (
                  <>
                    <button className="icon-button" type="button" title="Edit" aria-label="Edit" onClick={() => openEdit(question)}>
                      <Pencil size={17} />
                    </button>
                    <button
                      className="icon-button"
                      type="button"
                      title="Access policy"
                      aria-label="Access policy"
                      onClick={() => setAccessPolicyTarget(question)}
                    >
                      <KeyRound size={17} />
                    </button>
                    <button className="icon-button danger" type="button" title="Delete" aria-label="Delete" onClick={() => remove(question)}>
                      <Trash2 size={17} />
                    </button>
                  </>
                )}
                {auth.isSubAdmin && filters.deleted === "true" && (
                  <button className="icon-button" type="button" title="Restore" aria-label="Restore" onClick={() => restore(question)}>
                    <RotateCcw size={17} />
                  </button>
                )}
                {auth.isSuperAdmin && filters.deleted !== "true" && (
                  <>
                    <button className="icon-button success" type="button" title="Approve" aria-label="Approve" onClick={() => review(question, "selected")}>
                      <Check size={17} />
                    </button>
                    <button className="icon-button danger" type="button" title="Needs revision" aria-label="Needs revision" onClick={() => review(question, "rejected")}>
                      <X size={17} />
                    </button>
                    <button className="icon-button" type="button" title="Return to pending review" aria-label="Return to pending review" onClick={() => review(question, "pending")}>
                      <RotateCcw size={17} />
                    </button>
                  </>
                )}
              </div>
            </article>
          ))
        )}
      </section>

      {formMode && (
        <Modal title={formMode === "edit" ? "Edit Exam Package" : "New Exam Package"} onClose={() => setFormMode(null)}>
          <form className="form-grid" onSubmit={submitForm}>
            <label>
              <span>Title</span>
              <input value={form.title} onChange={(event) => setFormValue("title", event.target.value)} required />
            </label>
            <label>
              <span>Subject</span>
              <select value={form.courseId} onChange={(event) => setFormValue("courseId", event.target.value)} required>
                <option value="">Select subject</option>
                {courses.map((course) => (
                  <option value={course.id} key={course.id}>
                    {course.code} - {course.title}
                  </option>
                ))}
              </select>
            </label>
            <label className="toggle-row">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(event) => setFormValue("isActive", event.target.checked)}
              />
              <span>Active</span>
            </label>
            <fieldset className="form-section">
              <legend>Security & Distribution</legend>
              <label>
                <span>Access Policy</span>
                <select value={form.accessPolicy} onChange={(event) => setFormValue("accessPolicy", event.target.value)}>
                  <option value="standard">Standard access</option>
                  <option value="password">Password protected</option>
                  {canAssignTeachers && <option value="assigned">Assigned teachers only</option>}
                </select>
              </label>
              {form.accessPolicy === "password" && (
                <label>
                  <span>{formMode === "edit" ? "New access password (optional)" : "Access password"}</span>
                  <input
                    type="password"
                    value={form.accessPassword}
                    minLength={4}
                    required={formMode === "create"}
                    placeholder={formMode === "edit" ? "Leave blank to keep existing password" : "Minimum 4 characters"}
                    onChange={(event) => setFormValue("accessPassword", event.target.value)}
                  />
                </label>
              )}
              {form.accessPolicy === "assigned" && (
                <TeacherPicker
                  teachers={teachers}
                  selected={form.allowedUserIds}
                  onChange={(allowedUserIds) => setFormValue("allowedUserIds", allowedUserIds)}
                />
              )}
              <label>
                <span>Access expiry</span>
                <input
                  type="date"
                  value={form.accessExpiresAt}
                  onChange={(event) => setFormValue("accessExpiresAt", event.target.value)}
                />
              </label>
            </fieldset>
            <label>
              <span>Exam question file</span>
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                required={formMode === "create"}
                onChange={(event) => setFormValue("question", event.target.files?.[0] || null)}
              />
            </label>
            <label>
              <span>Preview image</span>
              <input
                type="file"
                accept="image/png,image/jpeg"
                required={formMode === "create"}
                onChange={(event) => setFormValue("image", event.target.files?.[0] || null)}
              />
            </label>
            <button className="button button-primary full" type="submit" disabled={busy}>
              <Upload size={17} />
              <span>{busy ? "Saving..." : "Save Package"}</span>
            </button>
          </form>
        </Modal>
      )}

      {accessPolicyTarget && (
        <AccessPolicyModal
          question={accessPolicyTarget}
          teachers={teachers}
          canAssignTeachers={canAssignTeachers}
          onClose={() => setAccessPolicyTarget(null)}
          onSaved={async () => {
            setAccessPolicyTarget(null);
            await loadQuestions();
          }}
        />
      )}

      {accessTarget && (
        <AccessPasswordModal
          question={accessTarget}
          onClose={() => setAccessTarget(null)}
          onUnlocked={(accessToken) => {
            sessionStorage.setItem(`sqb-question-access-${accessTarget.id}`, accessToken);
            setAccessTarget(null);
            navigate(`/questions/${accessTarget.id}`);
          }}
        />
      )}
    </div>
  );
}

function TeacherPicker({ teachers, selected, onChange }) {
  function toggle(id) {
    if (selected.includes(id)) {
      onChange(selected.filter((item) => item !== id));
      return;
    }
    onChange([...selected, id]);
  }

  return (
    <div className="teacher-picker">
      <span>Allowed Teachers</span>
      {teachers.length === 0 ? (
        <p>No teacher accounts found.</p>
      ) : (
        teachers.map((teacher) => (
          <label className="check-row" key={teacher.id}>
            <input type="checkbox" checked={selected.includes(teacher.id)} onChange={() => toggle(teacher.id)} />
            <span>
              <strong>{teacher.name}</strong>
              <small>{teacher.email}</small>
            </span>
          </label>
        ))
      )}
    </div>
  );
}

function AccessPolicyModal({ question, teachers, canAssignTeachers, onClose, onSaved }) {
  const auth = useAuth();
  const [accessPolicy, setAccessPolicy] = useState(question.accessPolicy || (question.hasPassword ? "password" : "standard"));
  const [password, setPassword] = useState("");
  const [accessExpiresAt, setAccessExpiresAt] = useState(dateInputValue(question.accessExpiresAt));
  const [allowedUserIds, setAllowedUserIds] = useState(question.allowedUsers?.map((user) => user.id) || []);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await auth.api(`/questions/${question.id}/access-policy`, {
        method: "PUT",
        body: {
          accessPolicy,
          password,
          accessExpiresAt,
          allowedUserIds
        }
      });
      await onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title="Access Policy" onClose={onClose}>
      <form className="form-grid" onSubmit={submit}>
        <label>
          <span>Policy</span>
          <select value={accessPolicy} onChange={(event) => setAccessPolicy(event.target.value)}>
            <option value="standard">Standard access</option>
            <option value="password">Password protected</option>
            {canAssignTeachers && <option value="assigned">Assigned teachers only</option>}
          </select>
        </label>
        {accessPolicy === "password" && (
          <label>
            <span>{question.hasPassword ? "New access password (optional)" : "Access password"}</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              minLength={4}
              required={!question.hasPassword}
              placeholder={question.hasPassword ? "Leave blank to keep existing password" : "Minimum 4 characters"}
            />
          </label>
        )}
        {accessPolicy === "assigned" && (
          <TeacherPicker teachers={teachers} selected={allowedUserIds} onChange={setAllowedUserIds} />
        )}
        <label>
          <span>Access expiry</span>
          <input type="date" value={accessExpiresAt} onChange={(event) => setAccessExpiresAt(event.target.value)} />
        </label>
        {error && <div className="alert alert-error">{error}</div>}
        <div className="button-row">
          <button className="button button-primary" type="submit" disabled={busy}>
            <KeyRound size={17} />
            <span>{busy ? "Saving..." : "Save Policy"}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}

function AccessPasswordModal({ question, onClose, onUnlocked }) {
  const auth = useAuth();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const payload = await auth.api(`/questions/${question.id}/password/check`, {
        method: "POST",
        body: { password }
      });
      onUnlocked(payload.accessToken);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title="Restricted Access" onClose={onClose}>
      <form className="form-grid" onSubmit={submit}>
        <label>
          <span>Access Password</span>
          <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
        </label>
        {error && <div className="alert alert-error">{error}</div>}
        <button className="button button-primary full" type="submit" disabled={busy}>
          <FileLock2 size={17} />
          <span>{busy ? "Checking..." : "Unlock"}</span>
        </button>
      </form>
    </Modal>
  );
}
