# Campus Question Vault Rebuild Plan

Figma design:
https://www.figma.com/design/4NVPrcz7hSquvO1eWR98u1

## Product Positioning

Campus Question Vault is a secure academic question distribution system for schools, colleges, universities, and multi-campus institutions.

The education domain stays clear. The cybersecurity showcase comes from:

- Role-based access control
- Protected question file delivery
- Password-gated restricted files
- Admin review workflow
- Soft delete and restore
- Audit logging for sensitive actions
- Teacher-only access to approved distributed questions

## Stakeholders

- Institution Admin: manages users, subjects, review workflow, audit logs, and security policy.
- Campus Admin / Question Setter: uploads exam questions and manages question metadata.
- Teacher / Receiver: accesses only approved and assigned question packages.

## Page Map

1. Login
   - Secure institution sign-in
   - Demo role shortcuts for local presentation

2. Dashboard
   - Secure questions count
   - Pending review count
   - Approved questions count
   - Restricted file count
   - Recent security events

3. Exam Questions
   - Search and filter by subject, status, access policy
   - Question cards with status, restricted badge, owner, subject
   - Admin actions: approve, reject, clear review, delete, restore

4. Create / Edit Exam Question
   - Question file upload
   - Preview image upload
   - Subject and campus metadata
   - Access policy
   - Optional password gate
   - Reviewer notes

5. Question Detail
   - Preview image / document preview
   - Security metadata
   - Owner, subject, access policy, password state
   - Download / unlock action
   - Access history

6. Subjects
   - Rename current Courses page to Subjects
   - Subject code, title, campus scope, active state

7. Teachers
   - Rename current Users page language to Teachers / Access Groups
   - Keep roles internally if needed, but show institution-friendly labels

8. Audit Logs
   - Login
   - Upload
   - Review approve/reject
   - Password set/clear
   - Download
   - Failed unlock
   - Delete / restore

9. Teacher Portal
   - Approved assigned questions only
   - Restricted file unlock modal
   - Download actions recorded in audit logs

## Two-Day Build Order

### Day 1 Morning

- Rebrand UI from Smart Question Bank to Campus Question Vault.
- Rename visible labels:
  - Courses -> Subjects
  - Questions -> Exam Questions
  - Users -> Teachers
  - Selected -> Approved
  - Pending -> Pending Review
  - Rejected -> Needs Revision
- Update seed data with educational institution subjects and demo users.

### Day 1 Afternoon

- Update dashboard cards and page headings.
- Update question list cards to match Figma.
- Update create/edit question modal labels.
- Add simple fields if time allows:
  - examType
  - campus
  - accessPolicy
  - reviewerNotes

### Day 2 Morning

- Add AuditLog model.
- Log sensitive actions:
  - login
  - question upload
  - question approval/rejection
  - password set/clear
  - file download
  - failed password unlock
  - delete/restore
- Add Audit Logs API and admin page.

### Day 2 Afternoon

- Polish responsive UI.
- Test all three roles locally.
- Update README with security-focused explanation.
- Prepare demo script for cybersecurity job interview.

## Local Run Steps

1. Install dependencies:

```bash
npm install
```

2. Start MongoDB:

```bash
npm run db:start
```

3. Seed demo data:

```bash
npm run seed
```

4. Run API and client:

```bash
npm run dev
```

5. Open the app:

```text
http://localhost:5173
```

## Demo Accounts

- superadmin@gmail.com / superadmin
- subadmin@gmail.com / subadmin
- user@gmail.com / user12345

## Interview Demo Story

I built Campus Question Vault as a secure question distribution platform for educational institutions. The system protects sensitive exam content through authenticated access, role-based authorization, password-gated files, approval workflow, soft-delete recovery, and audit logs for security accountability.
