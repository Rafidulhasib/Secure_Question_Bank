# Secure Question Bank Deployment

This project is a MERN app and should be deployed as two services:

- Frontend: Vercel, root directory `client`
- Backend API: Render, root directory `server`
- Database: MongoDB Atlas

## 1. MongoDB Atlas

Create a free Atlas cluster and copy the connection string.

Use a database name like:

```text
secure_question_bank
```

## 2. Backend on Render

Create a new Render Web Service from the GitHub repository.

Settings:

```text
Root Directory: server
Build Command: npm install
Start Command: npm run seed && npm start
```

Environment variables:

```text
NODE_ENV=production
MONGO_URI=<your MongoDB Atlas URI>
MONGO_SERVER_SELECTION_TIMEOUT_MS=5000
JWT_SECRET=<long random secret>
JWT_EXPIRES_IN=7d
CLIENT_URL=<your Vercel frontend URL>
```

After deploy, the API health URL should be:

```text
https://your-render-service.onrender.com/api/health
```

## 3. Frontend on Vercel

Create a new Vercel project from the same GitHub repository.

Settings:

```text
Root Directory: client
Framework Preset: Vite
Build Command: npm run build
Output Directory: dist
```

Environment variable:

```text
VITE_API_URL=https://your-render-service.onrender.com/api
```

## 4. Demo Accounts

The backend start command seeds demo data.

```text
Super Admin: superadmin@gmail.com / superadmin
Sub Admin: subadmin@gmail.com / subadmin
Teacher: user@gmail.com / user12345
Restricted package password: exam1234
```

## Important

Runtime uploads are stored in `server/uploads`. This is acceptable for a short demo because the seed script regenerates demo files, but production file uploads should move to object storage such as S3, Cloudinary, or Vercel Blob.
