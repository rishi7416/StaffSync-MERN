# StaffSync — MERN Stack HR Management Capstone

StaffSync is a full-stack Human Resource Management System built with MongoDB, Express.js, React, and Node.js. It is designed as an educational capstone and includes a responsive workspace for employee records, daily attendance, leave approvals, company announcements, and team training.

## Features

- JWT-based sign-in and protected API routes
- Role-aware actions (`admin`, `hr`, `manager`, `employee`)
- Employee directory with create, view, edit, delete, search, filters, and CSV export
- Attendance records with date filtering, check-in/check-out, and status updates
- Leave requests with date validation, pending/approved/rejected statuses, and reviewer notes
- Company announcements and news that HR/Admin can publish for all users
- Department-scoped training programs managed by managers, with HR/Admin oversight
- Dashboard summary cards and quick actions
- Responsive UI, form validation, error states, and MongoDB persistence

## Technology stack

- Frontend: React 18, Vite, React Router, Axios, Lucide icons, CSS
- Backend: Node.js, Express, Mongoose, JWT, bcryptjs, express-validator
- Database: MongoDB Community Server or MongoDB Atlas

## Requirements

- Node.js 20 LTS or newer recommended
- npm
- MongoDB running locally, or a MongoDB Atlas connection string
- Visual Studio Code (recommended)

## Project structure

```text
staffsync-mern/
├── client/
│   ├── src/
│   │   ├── components/       # Layout, modal, stat cards
│   │   ├── context/          # Authentication context
│   │   ├── pages/            # Login, dashboard, employees, attendance, leaves
│   │   ├── api.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── styles.css
│   ├── .env.example
│   ├── index.html
│   └── package.json
├── server/
│   ├── src/
│   │   ├── middleware/       # JWT authentication and role checks
│   │   ├── models/           # User, Employee, Attendance, Leave
│   │   ├── routes/           # REST API endpoints
│   │   ├── seed.js           # Creates local demo admin
│   │   └── server.js
│   ├── .env.example
│   └── package.json
├── package.json
└── README.md
```

## Setup in VS Code

### 1. Install prerequisites

Install Node.js and npm from the official Node.js website. Install MongoDB Community Server and start the MongoDB service, or create a MongoDB Atlas cluster.

### 2. Open the folder

Extract the project ZIP. In VS Code choose **File → Open Folder** and select `staffsync-mern`.

### 3. Configure the backend

In a terminal opened at the project root:

```bash
cd server
```

Copy `.env.example` to `.env` and update values as needed:

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/staffsync
JWT_SECRET=replace_this_with_a_long_random_secret
CLIENT_URL=http://localhost:5173
```

Use a long, random JWT secret. If you use Atlas, replace `MONGODB_URI` with your Atlas connection string. Keep `.env` private and never commit it.

Install backend dependencies:

```bash
npm install
```

Create the demo administrator:

```bash
npm run seed
```

Default local demo credentials:

- Email: `admin@staffsync.local`
- Password: `StaffSync@123`

These credentials are for local demonstration only. Do not deploy with the demo password. The seed script prints the configured credentials and does not reset an existing admin password.

### 4. Configure the frontend

Open a second terminal at the project root:

```bash
cd client
```

Copy `.env.example` to `.env` if you need to change the API URL. The default is:

```env
VITE_API_URL=/api
```

Vite proxies `/api` requests to `http://localhost:5000` during local development.

Install dependencies:

```bash
npm install
```

### 5. Run the app

Terminal 1, from `server/`:

```bash
npm run dev
```

Terminal 2, from `client/`:

```bash
npm run dev
```

Open the local URL printed by Vite, usually `http://localhost:5173`. Sign in using the demo credentials above.

You can also install the root development dependency and run both with `npm run install:all` followed by `npm run dev` from the root folder.

## Deploy one live URL with Render

The included `render.yaml` deploys the React client and Express API as one web service. MongoDB must be hosted separately, for example on MongoDB Atlas.

1. Create a MongoDB Atlas cluster and database user. Allow connections from Render in Atlas Network Access, then copy the connection URI.
2. Before deploying, seed the first administrator into that Atlas database from a local terminal. Keep the URI and password private:

	```powershell
	$env:MONGODB_URI = "<your Atlas connection URI>"
	$env:SEED_ADMIN_EMAIL = "admin@staffsync.local"
	$env:SEED_ADMIN_PASSWORD = "<a unique strong password>"
	npm run seed --prefix server
	```

3. In Render, choose **New → Blueprint**, connect `rishi7416/StaffSync-MERN`, and select the `render.yaml` blueprint.
4. Enter the Atlas URI for `MONGODB_URI` when prompted. Render generates `JWT_SECRET` automatically.
5. After deployment succeeds, open the `.onrender.com` URL shown for the `staffsync-mern` service and sign in using the admin email/password configured during seeding.

Do not commit Atlas credentials or production passwords. Free Render services may sleep when idle and take a short time to wake on the first request.

## REST API overview

All routes except health and login require an `Authorization: Bearer <token>` header.

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | API health check |
| POST | `/api/auth/login` | Sign in |
| GET | `/api/auth/me` | Current signed-in user |
| GET | `/api/employees` | List/search/filter employees |
| GET | `/api/employees/:id` | Employee detail |
| POST | `/api/employees` | Create employee (admin/hr) |
| PUT | `/api/employees/:id` | Update employee (admin/hr) |
| DELETE | `/api/employees/:id` | Delete employee (admin only) |
| GET | `/api/attendance` | List attendance records |
| POST | `/api/attendance` | Create attendance (admin/hr/manager) |
| PATCH | `/api/attendance/:id` | Update attendance status/times (admin/hr/manager) |
| POST | `/api/attendance/me/check-in` | Employee self check-in |
| POST | `/api/attendance/me/check-out` | Employee self check-out |
| GET | `/api/leaves` | List leave requests |
| POST | `/api/leaves` | Submit leave request (all signed-in roles; employees submit for themselves) |
| PATCH | `/api/leaves/:id/review` | Approve/reject leave (admin/hr/manager) |
| GET | `/api/announcements` | List company announcements (all signed-in roles) |
| POST | `/api/announcements` | Publish an announcement (admin/hr) |
| DELETE | `/api/announcements/:id` | Delete an announcement (admin/hr) |
| GET | `/api/training` | List training programs (department-scoped for managers/employees) |
| POST | `/api/training` | Create a training program (admin/hr/manager) |
| PATCH | `/api/training/:id` | Update a training program (admin/hr/manager, department-scoped for managers) |
| DELETE | `/api/training/:id` | Delete a training program (admin/hr/manager, department-scoped for managers) |

Query parameters:
- Employees: `search`, `department`, `status`
- Attendance: `date` (`YYYY-MM-DD`), `employee`
- Leaves: `status`, `employee`
- Training: `status`, `department` (department filtering is restricted to admin/HR)

## Testing checklist

1. Start MongoDB and both development servers.
2. Visit `http://localhost:5000/api/health`; expect `{"status":"ok","service":"StaffSync API"}`.
3. Sign in with the demo administrator credentials.
4. Add an employee with a unique employee ID and email.
5. Confirm the employee appears in the directory and dashboard count.
6. Search by name, email, employee ID, and filter by department/status.
7. Edit an employee and export the directory to CSV.
8. Mark attendance for the employee on today's date; attempt a duplicate and confirm the API prevents a duplicate record.
9. Change the attendance status and verify the dashboard count.
10. Create a leave request, approve it, and confirm its status changes.
11. Try invalid form values and confirm readable validation errors appear.
12. Sign out and confirm protected pages redirect to the login screen.

## Troubleshooting

- **MongoDB connection failed:** ensure MongoDB is running and the URI is correct.
- **Network Error in the browser:** check that the backend is running on port 5000 and the frontend API URL is correct.
- **CORS error:** make sure `CLIENT_URL` matches the Vite URL (default `http://localhost:5173`).
- **Port already in use:** change `PORT` in `server/.env` or stop the conflicting process.
- **Login rejected:** run `npm run seed` in `server/` and use the configured demo email/password. If the account already exists, the seed script intentionally does not reset its password.
- **Blank page:** inspect the browser console and terminal; ensure frontend dependencies installed successfully.

## Data model summary

- **User:** name, email, password hash, role
- **Employee:** employee ID, name, contact details, department, position, employment type, salary, joining date, status
- **Attendance:** employee reference, date, check-in/out, status, note; unique employee/date pair
- **Leave:** employee reference, type, start/end dates, reason, status, reviewer and review note

## Security and scope notes

This is an educational capstone starter, not a production HR platform. Before real-world deployment, add password reset and account provisioning, stronger rate limiting, audit logs, CSRF/security headers, stricter field-level access control, pagination, automated tests, backups, and a privacy review. Do not store real employee salary or personal information in a public demo. Registration is intentionally disabled so anonymous visitors cannot create administrator accounts.

## Future enhancements

- Employee self-service accounts and personal leave submission
- Payroll exports and salary slips
- Email notifications for leave decisions
- Charts and attendance analytics
- Unit/integration tests and CI pipeline


## Role-based workflows

- Admin/HR: open **Employees → Add employee**. Optionally set an initial login password and select Employee, Manager, or HR to provision a linked login account.
- Manager: sign in with a Manager account linked to an employee profile. The manager sees only their department and can review that department's leave requests and attendance.
- Employee: sign in with an Employee account. The employee sees their own profile/records, can apply for leave, and can use Check in / Check out on the Attendance page.
- Leave requests are Pending until approved/rejected by HR, Admin, or the employee's department Manager.

**Security note:** the demo admin account is local-development-only. Change its password and configure a strong `JWT_SECRET` before deployment. The app's API enforces role and record-level access; frontend visibility is only a usability layer.
