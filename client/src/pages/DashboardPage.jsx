import { BookOpen, CheckCircle2, Clock3, FileQuestion, LockKeyhole, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { assetUrl, queryString } from "../api/client.js";
import StatusPill from "../components/StatusPill.jsx";
import { useAuth } from "../state/AuthContext.jsx";

function StatCard({ icon: Icon, label, value, tone }) {
  return (
    <article className={`stat-card tone-${tone}`}>
      <span>
        <Icon size={21} />
      </span>
      <div>
        <strong>{value ?? 0}</strong>
        <small>{label}</small>
      </div>
    </article>
  );
}

function roleLabel(role) {
  const labels = {
    SuperAdmin: "Institution Admin",
    SubAdmin: "Campus Admin",
    User: "Teacher"
  };
  return labels[role] || role;
}

export default function DashboardPage() {
  const auth = useAuth();
  const [stats, setStats] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const [dashboardPayload, questionPayload] = await Promise.all([
          auth.api("/dashboard"),
          auth.api(`/questions${queryString({ limit: 6 })}`)
        ]);
        if (active) {
          setStats(dashboardPayload.data);
          setQuestions(questionPayload.data);
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
  }, [auth]);

  const cards =
    auth.user?.role === "SuperAdmin"
      ? [
          ["Subjects", stats?.courses, BookOpen, "teal"],
          ["Exam Packages", stats?.questions, FileQuestion, "blue"],
          ["Pending Review", stats?.pendingQuestions, Clock3, "amber"],
          ["Approved", stats?.selectedQuestions, CheckCircle2, "green"],
          ["Teachers", stats?.users, Users, "rose"]
        ]
      : auth.user?.role === "SubAdmin"
        ? [
            ["Subjects", stats?.courses, BookOpen, "teal"],
            ["My Packages", stats?.questions, FileQuestion, "blue"],
            ["Active", stats?.activeQuestions, CheckCircle2, "green"],
            ["Inactive", stats?.inactiveQuestions, Clock3, "amber"],
            ["Approved", stats?.selectedQuestions, LockKeyhole, "rose"]
          ]
        : [
            ["Distributed", stats?.publishedQuestions, FileQuestion, "blue"],
            ["Subjects", stats?.courses, BookOpen, "teal"]
          ];

  return (
    <div className="stack">
      <div className="page-heading">
        <div>
          <p>{roleLabel(auth.user?.role)}</p>
          <h1>Security Dashboard</h1>
          <span className="page-heading-subtitle">Review secure exam-package activity and access readiness.</span>
        </div>
        <Link className="button button-primary" to="/questions">
          <FileQuestion size={17} />
          <span>Exam Questions</span>
        </Link>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <section className="stat-grid">
        {cards.map(([label, value, Icon, tone]) => (
          <StatCard key={label} label={label} value={value} icon={Icon} tone={tone} />
        ))}
      </section>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <p>Latest</p>
            <h2>Exam Package Activity</h2>
          </div>
          <Link to="/questions" className="text-link">
            View all
          </Link>
        </div>
        <div className="compact-list">
          {questions.length === 0 ? (
            <div className="empty-state">No exam packages found.</div>
          ) : (
            questions.map((question) => (
              <Link className="compact-question" to={`/questions/${question.id}`} key={question.id}>
                <img src={assetUrl(question.imageFile?.url)} alt="" />
                <div>
                  <strong>{question.title}</strong>
                  <span>
                    {question.course?.code} · {question.course?.title}
                  </span>
                </div>
                <StatusPill status={question.reviewStatus} />
              </Link>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
