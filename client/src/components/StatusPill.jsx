export default function StatusPill({ status, children }) {
  const labels = {
    selected: "Approved",
    pending: "Pending Review",
    rejected: "Needs Revision",
    standard: "Standard Access",
    password: "Password Protected",
    assigned: "Assigned Teachers",
    superadmin: "Institution Admin",
    subadmin: "Campus Admin",
    user: "Teacher"
  };
  return <span className={`status-pill status-${status}`}>{children || labels[status] || status}</span>;
}
