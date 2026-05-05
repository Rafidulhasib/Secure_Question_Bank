import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import { useAuth } from "./state/AuthContext.jsx";
import CoursesPage from "./pages/CoursesPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import QuestionDetailPage from "./pages/QuestionDetailPage.jsx";
import QuestionsPage from "./pages/QuestionsPage.jsx";
import UsersPage from "./pages/UsersPage.jsx";

function Protected({ children }) {
  const auth = useAuth();
  const location = useLocation();

  if (auth.loading) {
    return <div className="boot-screen">Loading Campus Question Vault...</div>;
  }

  if (!auth.isAuthed) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}

function SuperAdminOnly({ children }) {
  const auth = useAuth();
  if (!auth.isSuperAdmin) {
    return <Navigate to="/" replace />;
  }
  return children;
}

export default function App() {
  const auth = useAuth();

  return (
    <Routes>
      <Route path="/login" element={auth.isAuthed ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route
        path="/"
        element={
          <Protected>
            <Layout />
          </Protected>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="questions" element={<QuestionsPage />} />
        <Route path="questions/:id" element={<QuestionDetailPage />} />
        <Route
          path="courses"
          element={
            <SuperAdminOnly>
              <CoursesPage />
            </SuperAdminOnly>
          }
        />
        <Route
          path="users"
          element={
            <SuperAdminOnly>
              <UsersPage />
            </SuperAdminOnly>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
