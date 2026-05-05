import { BookOpenCheck, LockKeyhole } from "lucide-react";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../state/AuthContext.jsx";

export default function LoginPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState("login");
  const [values, setValues] = useState({
    name: "",
    email: "superadmin@gmail.com",
    password: "superadmin"
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function update(field, value) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    setError("");
    setBusy(true);

    try {
      if (mode === "login") {
        await auth.login(values.email, values.password);
      } else {
        await auth.register(values);
      }
      navigate(location.state?.from?.pathname || "/", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-panel">
        <div className="login-brand">
          <span>
            <BookOpenCheck size={28} />
          </span>
          <div>
            <h1>Secure Question Bank</h1>
          </div>
        </div>

        <div className="segmented">
          <button className={mode === "login" ? "active" : ""} type="button" onClick={() => setMode("login")}>
            Login
          </button>
          <button className={mode === "register" ? "active" : ""} type="button" onClick={() => setMode("register")}>
            Register
          </button>
        </div>

        <form className="form-grid" onSubmit={submit}>
          {mode === "register" && (
            <label>
              <span>Name</span>
              <input value={values.name} onChange={(event) => update("name", event.target.value)} required />
            </label>
          )}
          <label>
            <span>Email</span>
            <input
              type="email"
              value={values.email}
              onChange={(event) => update("email", event.target.value)}
              required
            />
          </label>
          <label>
            <span>Password</span>
            <input
              type="password"
              value={values.password}
              onChange={(event) => update("password", event.target.value)}
              required
            />
          </label>
          {error && <div className="alert alert-error">{error}</div>}
          <button className="button button-primary full" type="submit" disabled={busy}>
            {busy ? "Please wait..." : mode === "login" ? "Login securely" : "Create teacher account"}
          </button>
        </form>

        <div className="login-hints">
          <button type="button" onClick={() => setValues({ name: "", email: "superadmin@gmail.com", password: "superadmin" })}>
            Super Admin
          </button>
          <button type="button" onClick={() => setValues({ name: "", email: "subadmin@gmail.com", password: "subadmin" })}>
            Sub Admin
          </button>
          <button type="button" onClick={() => setValues({ name: "", email: "user@gmail.com", password: "user12345" })}>
            Teacher
          </button>
        </div>
        <p className="login-note">
          <LockKeyhole size={15} />
          <span>
            Access password: <strong>exam1234</strong>
          </span>
        </p>
      </section>
    </main>
  );
}
