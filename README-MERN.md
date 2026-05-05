# Campus Question Vault MERN Rebuild

Campus Question Vault is a secure academic question distribution system for schools, colleges, universities, and multi-campus institutions. It is positioned as an education-domain project with a cybersecurity-focused implementation: authenticated access, role-based authorization, protected file delivery, password-gated question files, review workflow, soft-delete recovery, and audit-friendly operations.

## Stack

- MongoDB with Mongoose models
- Express API with JWT auth and role-based access
- React + Vite dashboard
- Node.js upload storage for question files, preview images, and profile images

## Current Main Features

- SuperAdmin: dashboard, users, courses, question review, trash restore
- SubAdmin: own question CRUD, upload files/images, trash restore, password protection
- User: published selected questions, password-gated file access
- Upgrades: searchable/filterable lists, safer password access tokens, responsive React UI

## Refined Product Direction

- SuperAdmin becomes Institution Admin / Exam Controller.
- SubAdmin becomes Campus Admin / Question Setter.
- User becomes Teacher / Authorized Receiver.
- Courses should be renamed to Subjects.
- Questions should be renamed to Exam Questions.
- Selected should be renamed to Approved.
- Pending should be renamed to Pending Review.
- Rejected should be renamed to Needs Revision.

## Run Locally

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create API env file:

   ```bash
   cp server/.env.example server/.env
   ```

3. Start MongoDB locally at `mongodb://127.0.0.1:27017/smart_question_bank`, or change `MONGO_URI`.

   If you prefer Docker, run:

   ```bash
   npm run db:start
   ```

4. Seed the default users and courses:

   ```bash
   npm run seed
   ```

5. Run the app:

   ```bash
   npm run dev
   ```

   The local API is configured to run on `http://localhost:5001/api` because port `5000` is often occupied by macOS services on this machine. The React app runs on `http://localhost:5173`.

## Docker-based MongoDB

If you have Docker installed, this repo includes a Docker Compose service for MongoDB. The database will be exposed on `localhost:27017` so the local API server can connect without changing `server/.env`.

```bash
npm run db:start
npm run seed
npm run dev
```

When you're done:

```bash
npm run db:stop
```

## Full Docker Containerization

For a fully containerized development environment, use Docker Compose to run all services (MongoDB, API, and Client):

```bash
docker compose up --build
```

This will:
- Start MongoDB on `localhost:27017`
- Build and start the API on `localhost:5000`
- Build and start the React client on `localhost:5173`

To seed the database in Docker:

```bash
docker compose exec api npm run seed
```

To stop all services:

```bash
docker compose down
```

The API runs on `http://localhost:5001` for local non-Docker development and the React app runs on `http://localhost:5173`. In full Docker Compose mode, confirm the API port in `docker-compose.yml`.

## Seed Accounts

- `superadmin@gmail.com` / `superadmin`
- `subadmin@gmail.com` / `subadmin`
- `user@gmail.com` / `user12345`

## Important Paths

- API: `server/src`
- React app: `client/src`
- Runtime uploads: `server/uploads`
- Legacy Laravel code remains in the original folders for reference.
