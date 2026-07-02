<div align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=0:0F172A,50:0078D4,100:06B6D4&height=220&section=header&text=DSIMS&fontSize=80&fontColor=ffffff&animation=fadeIn&fontAlignY=38&desc=Distributed%20Student%20Issue%20Management%20System&descAlignY=58&descSize=18" width="100%" />
</div>

<div align="center">
  <img src="https://readme-typing-svg.demolab.com?font=Fira+Code&weight=600&size=22&duration=3500&pause=800&color=06B6D4&center=true&vCenter=true&width=850&height=45&lines=Full-Stack+MERN+Application+on+Microsoft+Azure;MongoDB+Atlas+with+3-Node+Replica+Set;JWT+Authentication+%2B+Four-Tier+RBAC;50%2C000+Students+%7C+70%2C000+Issues+%7C+104+Automated+Tests" alt="Typing SVG" />
</div>

<div align="center">
  <img src="https://img.shields.io/badge/Status-Live%20on%20Azure-brightgreen?style=for-the-badge" alt="Status" />
  <img src="https://img.shields.io/badge/Version-2.0%20Final-blue?style=for-the-badge" alt="Version" />
  <img src="https://img.shields.io/badge/Node.js-24-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB" />
  <img src="https://img.shields.io/badge/Microsoft_Azure-0078D4?style=for-the-badge&logo=microsoftazure&logoColor=white" alt="Azure" />
  <img src="https://img.shields.io/badge/Tests-104%20Passing-success?style=for-the-badge" alt="Tests" />
</div>

<div align="center">
  <h3>Live Deployments</h3>
  <a href="https://white-beach-01486ac00.7.azurestaticapps.net">
    <img src="https://img.shields.io/badge/Frontend-Live-06B6D4?style=for-the-badge&logo=azurestaticwebapps&logoColor=white" alt="Frontend Live" />
  </a>
  <a href="https://dsims-backend-yasir-e4bbgkggesdxdkff.southeastasia-01.azurewebsites.net">
    <img src="https://img.shields.io/badge/Backend%20API-Live-0078D4?style=for-the-badge&logo=microsoftazure&logoColor=white" alt="Backend Live" />
  </a>
</div>

---

## Overview

DSIMS (Distributed Student Issue Management System) is a production-grade full-stack web application built to manage student grievances across multiple university campuses. The system provides a transparent and accountable grievance handling pipeline, allowing students to submit complaints, track resolution progress, and anonymously rate admin performance.

The project addresses the lack of a formal issue reporting mechanism in universities by delivering a scalable, fault-tolerant solution that serves four distinct user roles: Student, Department Admin, Management, and Super Admin. The system is fully deployed on Microsoft Azure with the frontend hosted on Azure Static Web Apps, the backend on Azure Web Apps, and the database on MongoDB Atlas with a three-node replica set.

---

## Highlights

- 10 MongoDB Collections with over 141,000 documents and 283 MB of production-ready data
- 35+ REST API Endpoints across 11 controllers with role-scoped authorization
- 9 Aggregation Pipelines for real-time analytics, resolution metrics, and admin performance tracking
- 6-State Finite State Machine enforcing valid issue lifecycle transitions
- Four-Tier RBAC with three layers of authorization (authentication, role check, data scoping)
- Anonymous Feedback System with auto-escalation for low ratings
- Complete React Frontend with 30+ pages and role-based dashboards
- 104 Automated Postman Tests organized into 14 phases with auto-chained tokens
- Deployed on Microsoft Azure with separate hosting for frontend and backend

---

## Live URLs

| Component | URL |
|-----------|-----|
| Frontend | https://white-beach-01486ac00.7.azurestaticapps.net |
| Backend API | https://dsims-backend-yasir-e4bbgkggesdxdkff.southeastasia-01.azurewebsites.net |
| Database | MongoDB Atlas (AWS Singapore, 3-node Replica Set) |

---

## Tech Stack

### Frontend

| Component | Technology |
|-----------|-----------|
| Framework | React 18 |
| Build Tool | Vite |
| Styling | Tailwind CSS |
| Routing | React Router v6 |
| HTTP Client | Axios (with interceptors) |
| Charts | Recharts |
| Icons | Lucide React |
| Notifications | React Hot Toast |

### Backend

| Component | Technology |
|-----------|-----------|
| Runtime | Node.js v24 |
| Framework | Express.js v5 |
| Database | MongoDB v7+ |
| ODM | Mongoose v9 |
| Authentication | JWT + bcrypt |
| Security | Helmet + CORS + express-rate-limit |
| Logging | Morgan |

### Cloud and DevOps

| Component | Service |
|-----------|---------|
| Frontend Hosting | Azure Static Web Apps |
| Backend Hosting | Azure Web Apps |
| Database Hosting | MongoDB Atlas (M0 Free Tier) |
| Version Control | Git and GitHub |
| API Testing | Postman (104 automated tests) |

---

## System Architecture

The system follows a three-tier architecture with clear separation between presentation, application, and data layers. The presentation layer is a React single-page application deployed on Azure Static Web Apps with global CDN distribution. It communicates with the application layer via HTTPS requests carrying JWT bearer tokens. The application layer is an Express.js backend deployed on Azure Web Apps that processes every request through a five-stage middleware pipeline consisting of CORS, Helmet, JSON Parser, Rate Limiter, and Authentication Middleware before reaching the business logic in 11 controllers. The data layer uses MongoDB Atlas with a three-node replica set on AWS Singapore for high availability and automatic failover.

---

## Database Schema (10 Collections)

| Collection | Documents | Purpose |
|------------|-----------|---------|
| campuses | 6 | University campus locations |
| departments | 120 | 20 departments per campus (academic, support, administrative) |
| admins | 122 | Department admins, management, and super admins |
| students | 49,997 | Enrolled students with verified emails |
| issues | 70,000 | Student complaints with embedded audit trail |
| feedbacks | 19,598 | Anonymous ratings of admin performance |
| notifications | 1,000 | Event-driven messages for all roles |
| announcements | 1 sample | Top-down broadcasts from management |
| resourcerequests | 1 sample | Department resource and budget requests |
| tokenblacklists | Dynamic | Invalidated JWT tokens with TTL auto-cleanup |

---

## User Roles and Access Control

### 1. Student

- Register with institutional email verification
- Submit issues with categories, subcategories, and priority levels
- Track issue status in real time with full history timeline
- Edit or delete own issues (only in submitted state)
- Reopen resolved issues up to 3 times with mandatory reason
- Submit anonymous feedback with 1-to-5 star rating
- View personal dashboard with issue statistics

### 2. Department Admin

- View and manage issues assigned to their department only
- Approve or reject pending student registrations
- Assign issues to self and update status following FSM rules
- Provide mandatory resolution summaries (min 30 characters)
- Provide mandatory rejection reasons (min 20 characters)
- View anonymous feedback with performance summary
- Submit resource requests to management

### 3. Management

- View campus-wide analytics with interactive charts
- Access 5 report endpoints (status, category, monthly trend, resolution metrics, department performance)
- Create and manage campus-wide or department-specific announcements
- Review and approve or reject resource requests from department admins

### 4. Super Admin

- Cross-campus view of all issues and admins
- Manage all admin accounts (suspend, reactivate)
- View admin leaderboard ranked by average feedback rating
- Access flagged feedback for underperforming admins
- Delete resolved or closed issues with mandatory audit reason
- Cannot suspend the last active super admin (safety constraint)

---

## Key Features

### Issue Lifecycle (6-State Finite State Machine)

The issue status follows a strict finite state machine where submitted can transition to under_review or rejected, under_review can transition to in_progress or rejected, in_progress can transition to resolved or rejected, resolved can transition to closed or be reopened by the student up to a maximum of 3 times, and both closed and rejected are terminal states where no further modifications are possible.

### Privacy and Transparency System

Feedback is anonymous to department admins but visible to super admin for investigation purposes. The system auto-escalates feedback with a rating of 2 or below, or when students indicate the issue was not actually resolved. Admin performance is tracked through aggregated metrics and a public leaderboard. Every status change is recorded in an immutable embedded updates array inside each issue document.

### Business Constraints (Enforced at Controller Level)

Resolution summary must be at least 30 characters. Rejection reason must be at least 20 characters. Edit reason must be at least 15 characters. Delete reason must be at least 20 characters. Issue must be assigned to an admin before marking as in-progress. Department must belong to the student's campus. Maximum 3 reopens per issue. Cannot suspend the last active super admin.

---

## Database Optimizations

### Indexing Strategy (38 Total Indexes)

The issues collection has 7 indexes covering campus_id for multi-tenant scoping, a compound index on department_id and status for admin queries, student_id for student's own issues, createdAt in descending order for default sorting, campus_id with primary_category for category reports, primary_category with subcategory for drill-down reports, and a text index on title and description for full-text search.

The feedbacks collection has a unique index on issue_id guaranteeing one feedback per issue at the database level. The token_blacklist collection has a TTL index that auto-deletes expired tokens every 60 seconds without any scheduled jobs.

### Query Optimizations

Lean queries using .lean() on read endpoints provide 30-40% faster reads by skipping Mongoose document hydration. Selective population fetches only needed fields from related collections. Pagination cap limits maximum items per request to 100 preventing server overload. Search input sanitization escapes regex special characters preventing ReDoS attacks. Allowed sort fields whitelist prevents injection through query parameters.

---

## Security Features

JWT Authentication with 1-hour expiry for students and 8-hour expiry for admins. bcrypt Password Hashing with 10 salt rounds. Token Blacklisting on logout with TTL auto-cleanup. Rate Limiting at 200 requests per 15 minutes for general endpoints and 10 requests per 15 minutes for authentication endpoints. Helmet.js adds 11 security-related HTTP headers automatically. CORS Configuration restricts API access to the authorized frontend origin. Three-Layer Authorization covering authentication, role check, and data scoping. Regex Email Validation for institutional email format. Environment Variables for all sensitive credentials.

---

## Aggregation Pipelines (9 Total)

| Pipeline | Purpose |
|----------|---------|
| Student Dashboard Stats | Personal issue counts by status |
| Admin Dashboard Stats | Department status and priority counts |
| Status Count Report | Cross-campus status distribution |
| Category Count Report | Issues grouped by category and subcategory |
| Monthly Trend | Time-series issue creation using $year and $month |
| Resolution Metrics | Average resolution time using $subtract and $divide |
| Department Performance | Resolution rate per department using $lookup |
| Admin Performance | Per-admin ratings using triple $lookup |
| Admin Leaderboard | Admins ranked by average rating |

---

## API Documentation

### Authentication

POST /auth/register for student registration. GET /auth/verify/:token for email verification. POST /auth/login for login across all 4 roles. POST /auth/logout for logout with token blacklisting. GET /auth/me for current user profile. PATCH /auth/me for profile or password update.

### Issues

POST /issues for creating a new issue as a student. GET /issues/my for own issues with pagination. GET /issues/:id for single issue detail. PATCH /issues/:id for editing own issue in submitted state. DELETE /issues/:id for deleting own issue in submitted state. PATCH /issues/:id/status for changing status as department admin with FSM enforcement. PATCH /issues/:id/assign for self-assigning an issue as department admin. PATCH /issues/:id/reopen for reopening a resolved issue as student with a maximum of 3 times. GET /issues/department for department issues as department admin. GET /issues/all for cross-campus issues as super admin. DELETE /issues/:id/super-delete for deleting with audit as super admin.

### Dashboards and Reports

GET /issues/dashboard/student for student statistics. GET /issues/dashboard/admin for admin statistics. GET /reports/status-counts for status distribution. GET /reports/category-counts for category breakdown. GET /reports/monthly-trends for time-series trends. GET /reports/resolution-metrics for resolution time analytics. GET /reports/department-performance for department comparison.

### Feedback

POST /feedback/issue/:id for submitting anonymous feedback. GET /feedback/my for own submitted feedbacks. GET /feedback/admin-view for anonymous view for admin. GET /feedback/admin-summary for aggregated performance summary.

### Admin Management

GET /admins for listing admins as super admin. GET /admins/:id for admin detail with metrics. GET /admins/leaderboard for rankings by rating. PATCH /admins/:id/status for suspending or reactivating.

### Notifications

GET /notifications for paginated list. GET /notifications/unread-count for unread count. PATCH /notifications/:id/read for marking as read. PATCH /notifications/read-all for marking all as read.

### Utility

GET /categories for category-subcategory mapping. GET /campuses for campus list. GET /departments with campus_id query parameter for departments by campus.

---

## Project Structure

The project is organized into two main directories. The backend directory contains config with db.js for database connection, controllers with 11 controller files handling all business logic, models with 10 model files defining MongoDB schemas, routes for API routing, middleware containing auth.middleware.js and role.middleware.js, utils with categories.js for the category-subcategory mapping, seed with seedData.js for database population, and server.js as the entry point.

The frontend directory contains src with components for reusable UI components, pages organized by role into student, admin, management, and superadmin subdirectories, services with api.js for Axios configuration, contexts for React context providers, and App.jsx as the main application component. Configuration files include vite.config.js and tailwind.config.js at the root of the frontend directory.

---

## Installation and Setup

### Prerequisites

Node.js 18 or higher, MongoDB Atlas account (free tier works), and Git.

### Clone the Repository

Run git clone followed by the repository URL and cd into the project directory.

### Backend Setup

Navigate to the backend directory, run npm install, copy .env.example to .env, and configure the environment variables including PORT set to 5000, MONGO_URI with your MongoDB Atlas connection string, JWT_SECRET with your secret key, FRONTEND_URL set to http://localhost:5173, and NODE_ENV set to development. Start the backend with npm start and it runs at http://localhost:5000.

### Frontend Setup

Navigate to the frontend directory, run npm install, copy .env.example to .env, and set VITE_API_URL to http://localhost:5000. Start the frontend with npm run dev and it runs at http://localhost:5173.

### Seed the Database (Optional)

Navigate to the backend directory and run node seed/seedData.js to populate the database with 6 campuses, 120 departments, 122 admins, 49,997 students, 70,000 issues, and 19,598 feedbacks.

---

## Testing

The system is validated with 104 automated Postman tests organized into 14 phases covering sanity and setup (4 tests), authentication (7 tests), issue lifecycle (20 tests), admin edit and reject (7 tests), student delete (3 tests), dashboards and reports (8 tests), notifications (4 tests), security (7 tests), profile update (2 tests), feedback lifecycle (14 tests), admin feedback view (2 tests), super admin powers (12 tests), admin suspension (4 tests), and role blocking (6 tests). All tests use auto-chained tokens and IDs enabling end-to-end execution with a single click in Postman Runner.

---

## Deployment

### Frontend (Azure Static Web Apps)

Automatic deployment from GitHub, global CDN for fast worldwide delivery, environment variable VITE_API_URL configured to backend Azure URL, and custom SPA fallback routing for React Router.

### Backend (Azure Web Apps)

Node.js runtime with automatic scaling capability, environment variables managed via Azure Configuration, continuous deployment from GitHub, and HTTPS enforced by default with automatic SSL certificate.

### Database (MongoDB Atlas)

M0 Free Tier cluster on AWS Singapore, 3-node replica set with automatic failover, SRV connection string for auto-discovery, and 512 MB storage with 283 MB currently used.

---

## Performance Metrics

| Metric | Value |
|--------|-------|
| Total Documents | 141,000+ |
| Database Size | 283 MB |
| Total Indexes | 38 |
| Average Query Time | Under 100ms |
| Backend Response Time | 300-700ms |
| Frontend Load Time | Under 2s via CDN |
| Automated Tests | 104 passing |
| Uptime (Atlas) | 99.995% SLA |

---

## Challenges Overcome

Frontend-Backend Integration was solved by creating a dedicated categories endpoint and fixing the campus_id extraction bug in dropdown loading. Cross-Origin Deployment required configuring CORS between Azure Static Web Apps and Azure Web Apps. Email Verification in Cloud was addressed by redesigning link generation using environment-based URLs instead of hardcoded localhost. Role-Based Route Protection was implemented with three-layer authorization to prevent security bypasses. Admin Accountability was enforced through mandatory resolution summaries, student reopen capability, anonymous feedback, and the deliberate absence of delete capability for department admins.

---

## Future Enhancements

Real email integration via SendGrid or Mailtrap. File upload support for issue attachments with schema already prepared. WebSocket-based real-time notifications. Native mobile application using React Native. Two-factor authentication for admin and super admin roles. Multi-language support for regional accessibility. Advanced analytics with machine learning for issue categorization.

---

## Contributors

Muhammad Yasir (NUM-BSCS-2023-37) serving as Full-Stack Developer responsible for Backend Architecture and Deployment. Raza Ullah Khan (NUM-BSCS-2023-28) serving as Full-Stack Developer responsible for Frontend Implementation and Testing.

---

## Academic Context

University: Namal University Mianwali. Department: Computer Science. Course: Advanced Database Management Systems. Supervisor: Dr. Muzamil Ahmed. Semester: 6th Semester (Spring 2026).

---

## Connect With Me

<div>
  <a href="https://www.linkedin.com/in/muhammad-yasir-6a9500343/">
    <img src="https://img.shields.io/badge/LinkedIn-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white" alt="LinkedIn" />
  </a>
  <a href="mailto:muhammadyasir85a@gmail.com">
    <img src="https://img.shields.io/badge/Email-EA4335?style=for-the-badge&logo=gmail&logoColor=white" alt="Email" />
  </a>
  <a href="https://github.com/MuhammadYasir85a">
    <img src="https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white" alt="GitHub" />
  </a>
</div>

---

## Acknowledgments

Namal University Mianwali for academic guidance and infrastructure. Dr. Muzamil Ahmed for supervision and technical direction. MongoDB and Microsoft Azure for excellent documentation and free-tier services. The open-source community for the tools and libraries that made this project possible.

---

## License

This project is licensed under the MIT License. See the LICENSE file for details.

---

<div align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=0:06B6D4,50:0078D4,100:0F172A&height=120&section=footer" width="100%" />
</div>

<div align="center">
  <sub>Built with dedication at Namal University Mianwali | Spring 2026</sub>
</div>
