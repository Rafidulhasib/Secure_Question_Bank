# Recruiter and Master's Admissions Feature Roadmap

## Best Project Positioning

Campus Question Vault is a secure academic question distribution platform for institutions that handle sensitive exam files.

Use this one-line pitch:

> I built a MERN-based secure document distribution system for educational institutions, with role-based access control, protected file delivery, approval workflow, password-gated resources, soft-delete recovery, and audit logging.

## Features That Matter Most

### 1. Audit Logs

Why it impresses:
Security recruiters and admissions officers both value traceability.

Add logs for:

- Login
- Question upload
- Question approval / rejection
- Password set / clear
- File download
- Failed unlock attempt
- Delete / restore

Show this as a Security Audit page.

### 2. Access Policy Per Question

Why it impresses:
It shows authorization design beyond basic login.

Add:

- Public to approved teachers
- Restricted by password
- Restricted by subject
- Restricted by campus / department
- Restricted by teacher group

### 3. Security Dashboard

Why it impresses:
It turns the app into a security-aware admin system.

Show:

- Total secure question files
- Pending review
- Approved files
- Restricted files
- Downloads today
- Failed unlock attempts
- Recently restored files

### 4. Review Workflow

Why it impresses:
It proves you understand real institutional process.

States:

- Draft
- Pending Review
- Approved
- Needs Revision
- Archived

### 5. Protected File Delivery

Why it impresses:
This is the strongest cybersecurity feature already present in the project.

Improve the story:

- Files should not be directly public.
- Download goes through an authenticated API route.
- Password-gated files require temporary access tokens.
- Every download should be logged.

### 6. Role-Based UI

Why it impresses:
It shows both frontend and backend authorization thinking.

Roles:

- Institution Admin / Exam Controller
- Campus Admin / Question Setter
- Teacher / Authorized Receiver
- Optional: Auditor / Security Reviewer

### 7. Data Retention and Recovery

Why it impresses:
Soft delete and restore are practical enterprise features.

Add:

- Archived questions
- Restore action
- Permanent delete only for Institution Admin
- Audit entry for delete and restore

## Features For Software Engineering Master's Appeal

- Clear system architecture diagram
- API route documentation
- Database schema diagram
- Pagination and filtering
- Input validation
- Reusable React components
- Clean README with setup instructions
- Docker-based local database
- Seed data for demo
- Responsive UI

## Features For Cybersecurity Master's Appeal

- Threat model document
- RBAC matrix
- Audit log design
- Protected download flow
- Password hashing with bcrypt
- JWT-based authentication
- Secure headers with Helmet
- CORS configuration
- Failed access attempt tracking
- Security limitations section explaining what should be improved in production

## High-Impact MVP Order

1. Rebrand UI to Campus Question Vault.
2. Rename Courses to Subjects and Users to Teachers.
3. Add Audit Logs.
4. Add Access Policy and campus/department metadata.
5. Add Security Dashboard cards.
6. Add protected download logging.
7. Add README sections: architecture, security features, future improvements.

## Stretch Features

These are impressive, but only add them after the MVP is stable:

- Two-factor authentication
- Email invitation system
- Download watermarking
- File expiry date
- Teacher group assignment
- IP/device logging
- Admin export of audit logs as CSV
- PDF preview inside app
- Object storage support such as S3
- Automated tests for access-control rules

## Demo Script

1. Login as Institution Admin.
2. Show dashboard and security metrics.
3. Open pending exam questions.
4. Approve or reject one question.
5. Login as Campus Admin and upload a restricted question.
6. Login as Teacher and unlock/download an approved question.
7. Return to Admin and show the audit log entry for the download.

That flow tells a complete cybersecurity story without making the app too large.
