import { ArrowLeft, Download, FileLock2, KeyRound } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { assetUrl, queryString, questionFileUrl } from "../api/client.js";
import Modal from "../components/Modal.jsx";
import StatusPill from "../components/StatusPill.jsx";
import { useAuth } from "../state/AuthContext.jsx";

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

export default function QuestionDetailPage() {
  const { id } = useParams();
  const auth = useAuth();
  const [question, setQuestion] = useState(null);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    const accessToken = sessionStorage.getItem(`sqb-question-access-${id}`);
    const payload = await auth.api(`/questions/${id}${queryString({ accessToken })}`);
    setQuestion(payload.data);
    if (payload.data.accessRequired) {
      setPasswordOpen(true);
    }
  }

  useEffect(() => {
    let active = true;

    async function run() {
      setError("");
      try {
        const accessToken = sessionStorage.getItem(`sqb-question-access-${id}`);
        const payload = await auth.api(`/questions/${id}${queryString({ accessToken })}`);
        if (active) {
          setQuestion(payload.data);
          setPasswordOpen(Boolean(payload.data.accessRequired));
        }
      } catch (err) {
        if (active) {
          setError(err.message);
        }
      }
    }

    run();
    return () => {
      active = false;
    };
  }, [auth, id]);

  return (
    <div className="stack">
      <div className="page-heading">
        <div>
          <p>Exam package</p>
          <h1>{question?.title || "Loading..."}</h1>
          <span className="page-heading-subtitle">Review secure metadata, access policy, and download readiness.</span>
        </div>
        <Link className="button button-ghost" to="/questions">
          <ArrowLeft size={17} />
          <span>Back</span>
        </Link>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {question && (
        <section className="detail-layout">
          <div className="detail-media">
            <img src={assetUrl(question.imageFile?.url)} alt="" />
          </div>
          <article className="panel detail-panel">
            <div className="question-meta">
              <span>{question.course?.code}</span>
              <StatusPill status={question.reviewStatus} />
              <StatusPill status={question.isActive ? "active" : "inactive"}>{question.isActive ? "Active" : "Inactive"}</StatusPill>
              <StatusPill status={accessPolicyStatus(question.accessPolicy)}>{accessPolicyLabel(question.accessPolicy)}</StatusPill>
              {question.isExpired && <StatusPill status="expired">Expired</StatusPill>}
            </div>
            <h2>{question.title}</h2>
            <p>{question.course?.title}</p>
            <dl className="detail-list">
              <div>
                <dt>Owner</dt>
                <dd>{question.owner?.name || "Unknown"}</dd>
              </div>
              <div>
                <dt>Created</dt>
                <dd>{new Date(question.createdAt).toLocaleDateString()}</dd>
              </div>
              <div>
                <dt>File</dt>
                <dd>{question.questionFile?.originalName || "Locked"}</dd>
              </div>
              <div>
                <dt>Access</dt>
                <dd>{question.accessLabel || accessPolicyLabel(question.accessPolicy)}</dd>
              </div>
              <div>
                <dt>Allowed</dt>
                <dd>
                  {question.accessPolicy === "assigned"
                    ? question.allowedUsers?.map((user) => user.name).join(", ") || "No teachers assigned"
                    : "Role-approved teachers"}
                </dd>
              </div>
              <div>
                <dt>Expires</dt>
                <dd>{question.accessExpiresAt ? new Date(question.accessExpiresAt).toLocaleDateString() : "No expiry"}</dd>
              </div>
            </dl>
            {question.accessRequired ? (
              <button className="button button-primary" type="button" onClick={() => setPasswordOpen(true)}>
                <KeyRound size={17} />
                <span>Unlock File</span>
              </button>
            ) : (
              <a
                className="button button-primary"
                href={questionFileUrl(question.id, auth.token, sessionStorage.getItem(`sqb-question-access-${id}`))}
                target="_blank"
                rel="noreferrer"
              >
                <Download size={17} />
                <span>Open File</span>
              </a>
            )}
          </article>
        </section>
      )}

      {passwordOpen && question && (
        <UnlockModal
          id={id}
          onClose={() => setPasswordOpen(false)}
          onUnlocked={async (token) => {
            sessionStorage.setItem(`sqb-question-access-${id}`, token);
            setPasswordOpen(false);
            await load();
          }}
        />
      )}
    </div>
  );
}

function UnlockModal({ id, onClose, onUnlocked }) {
  const auth = useAuth();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const payload = await auth.api(`/questions/${id}/password/check`, {
        method: "POST",
        body: { password }
      });
      await onUnlocked(payload.accessToken);
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
