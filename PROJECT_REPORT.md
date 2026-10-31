# StaffSync — Project Report

## 1. Title
**StaffSync: Modern Human Resource Management System using MERN Stack**

## 2. Abstract
StaffSync is a web-based HR management application that centralises employee information, attendance, leave requests, company announcements, and team training programs. It provides role-aware access for HR staff, managers, and employees through a responsive interface backed by a MongoDB database and REST API.

## 3. Problem statement
Small organisations often maintain employee details, attendance, leave approvals, internal updates, and training plans across separate spreadsheets or paper records. This can lead to duplication, delayed updates, and difficulty finding current information. StaffSync demonstrates how a single web application can keep these workflows organised and searchable.

## 4. Objectives
- Build a responsive full-stack web application using the MERN stack.
- Store and retrieve employee data persistently.
- Support employee record creation, editing, searching, filtering, and CSV export.
- Record daily attendance and prevent duplicate attendance entries for an employee on the same date.
- Track leave requests and record approval/rejection decisions.
- Publish company announcements and make them available to all signed-in users.
- Manage team training programs with department-level access for managers.
- Protect application routes with token-based authentication and role checks.

## 5. Scope
The current implementation includes role-based sign-in, employee directory, attendance management, leave management, company announcements, team training programs, dashboard summary, and API validation. It is a capstone demonstration and should not be used as a production HR service without additional security and privacy work.

## 6. Tools and technologies
- React and Vite for the user interface
- Node.js and Express.js for the API
- MongoDB and Mongoose for persistence
- JSON Web Tokens for authentication
- bcryptjs for password hashing
- Axios for API communication
- Visual Studio Code for development

## 7. System modules
1. **Authentication:** verifies credentials and provides a signed token.
2. **Dashboard:** displays total employees, active employees, today's attendance and pending leave counts.
3. **Employee management:** maintains employee profiles and provides search, filters and CSV export.
4. **Attendance management:** records daily attendance, check-in/check-out times, and status.
5. **Leave management:** records leave periods and reasons and supports review decisions.
6. **Announcements:** lets HR/Admin publish news, policy updates, and events for all signed-in users.
7. **Training:** lets managers manage programs for their department while HR/Admin can oversee the organisation.

## 8. Architecture
The React client sends HTTP requests to the Express REST API. Protected routes validate the JWT before accessing application resources. Mongoose models define the database structure and communicate with MongoDB. The API returns JSON responses consumed by the client.

## 9. Database design
- **User:** name, email, password hash, role.
- **Employee:** employee ID, name, email, phone, department, position, employment type, salary, joining date, status.
- **Attendance:** employee reference, date, check-in, check-out, status, note. A unique index prevents duplicate employee/date records.
- **Leave:** employee reference, leave type, start date, end date, reason, status, reviewer and review note.
- **Announcement:** title, body, category, pinned state, and author.
- **Training program:** title, description, department, provider, format, location, dates, status, and author.

## 10. Testing plan
- Valid and invalid login credentials
- Employee create, read, update, delete and duplicate-field validation
- Search and department/status filtering
- Attendance creation, duplicate prevention and status updates
- Leave creation, invalid date range handling and approval/rejection
- Announcement visibility and HR/Admin publishing permissions
- Manager training department access and invalid training date range handling
- Unauthenticated API request rejection
- Responsive layout and CSV export

Record actual results after running the application; do not claim tests passed until you have executed them.

## 11. Limitations
The demo uses a seeded administrator and does not include public registration, payroll processing, password reset, training enrollment tracking, notification delivery, or full production-grade audit and security controls.

## 12. Future scope
Add employee self-service, notifications, analytics, payroll reports, automated tests, audit trails, pagination, deployment automation, and stronger security controls.

## 13. Conclusion
StaffSync demonstrates the integration of a React interface, Express API, and MongoDB data layer in a practical HR management scenario. It offers a foundation for learning CRUD operations, authentication, data modelling, and multi-module application design.


## Role-based access and self-service (updated)

StaffSync supports four roles: **Admin, HR, Manager and Employee**. The backend enforces permissions on protected API routes; hiding a button in the interface is not treated as security.

| Capability | Admin | HR | Manager | Employee |
|---|---:|---:|---:|---:|
| View employee directory | All | All | Own department | Own profile |
| Add/edit employee records | Yes | Yes | No | No |
| Delete employee records | Yes | No | No | No |
| Provision employee login | Yes | Yes | No | No |
| View attendance | All | All | Own department | Own records |
| Mark/update team attendance | Yes | Yes | Own department | No |
| Self check-in/check-out | No | No | No | Yes |
| Submit leave request | Yes | Yes | Yes | Own request |
| Review leave requests | All | All | Own department | No |

### Employee account linking

When HR/Admin creates an employee, they can optionally provide an initial login password and choose Employee, Manager or HR as the account role. The account is linked to that employee profile. Passwords are hashed using bcrypt before storage. An employee account without a linked profile cannot access personal records and should be linked by HR/Admin.

### Self-service workflows

- Employees can see only their own profile, attendance and leave requests.
- Employees can check in and check out for the current server-local date. Duplicate check-ins/check-outs are rejected.
- Employees can submit leave requests for their linked profile; they cannot choose another employee.
- Managers are linked to an employee profile and can see/manage only employees and leave requests in that profile's department.
- HR/Admin can manage the organisation. Admin alone can delete employee records.

### Important deployment notes

The included seed credentials are for local demonstration only. Change the demo password and set a strong, unique `JWT_SECRET` before any deployment. Configure `MONGODB_URI` and `CLIENT_URL` for the target environment, use HTTPS, and never commit `.env` files. For production, add password reset, audit logging, rate limiting, and a formal account deactivation workflow.
