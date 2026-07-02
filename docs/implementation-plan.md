# Implementation Plan — DSIMS

## 1. Overview

The DSIMS project was implemented in seven phases from initial planning to full deployment. This document reflects the completed implementation status of each phase.

## 2. Phase 1 — Backend Environment Setup (Completed)

Deliverables:
- Node.js backend initialized with npm
- Dependencies installed: Express, Mongoose, bcrypt, JWT, dotenv, Helmet, CORS, express-rate-limit, morgan
- MongoDB Atlas cluster provisioned (M0 Free Tier, AWS Singapore)
- Environment variables configured in `.env`
- Database connection established via Mongoose SRV connection string
- Health check endpoint operational

Status: Completed

## 3. Phase 2 — Database Schema Implementation (Completed)

Deliverables:
- 8 initial Mongoose schemas created and validated: campuses, departments, students, admins, issues, feedbacks, notifications, token_blacklist
- 2 additional schemas added in later phase: announcements, resource_requests
- Total collections: 10
- Schema validation rules enforced: enums, ranges, regex patterns, unique constraints, required fields
- Reference relationships defined using ObjectId
- Embedded documents implemented for issue updates and attachments
- 38 indexes created across all collections
- TTL index configured on token_blacklist for auto-cleanup
- Text indexes created for full-text search

Status: Completed

## 4. Phase 3 — Authentication and Authorization (Completed)

Deliverables:
- Student registration endpoint with email verification
- Admin registration handled through seed script
- Password hashing using bcrypt with 10 salt rounds
- JWT token generation on login with role-specific expiry (1h students, 8h admins)
- JWT verification middleware
- Role-based access control middleware
- Token blacklisting on logout with TTL auto-cleanup
- Three-layer authorization: authentication, role check, data scoping
- Email verification flow with token expiry (24 hours)
- Password change and profile update endpoints

Status: Completed

## 5. Phase 4 — Core Issue Management Module (Completed)

Deliverables:
- Issue submission endpoint with dynamic category validation
- 6-state finite state machine implementation for status lifecycle
- Issue assignment endpoint for department admins
- Student issue history endpoint with pagination, filtering, sorting
- Department dashboard endpoint for admins
- Cross-campus view for super admin
- Issue edit endpoint (student, only in submitted state)
- Issue delete endpoint (student, only in submitted state)
- Admin edit endpoint with mandatory reason logging
- Super admin delete endpoint with audit trail
- Reopen endpoint for resolved issues (max 3 times per issue)
- Business constraints enforced: resolution summary length, rejection reason length, edit reason length

Status: Completed

## 6. Phase 5 — Notification and Feedback System (Completed)

Deliverables:
- Auto-generated notifications on issue creation
- Auto-generated notifications on status changes
- Notification list, unread count, mark-as-read endpoints
- Anonymous feedback submission after issue resolution or rejection
- Feedback validation with unique constraint on issue_id
- Auto-escalation for low ratings (1 or 2 stars)
- Auto-escalation for disputed resolutions
- Anonymous view for department admin (student identity hidden)
- Full view for super admin (identity visible for investigation)
- Admin performance summary endpoint

Status: Completed

## 7. Phase 6 — Reporting and Analytics (Completed)

Deliverables:
- 9 aggregation pipelines implemented across controllers
- Student dashboard stats (personal issue counts by status)
- Admin dashboard stats (department status and priority counts)
- Status count report (cross-campus distribution)
- Category count report (grouped by category and subcategory)
- Monthly trend report (time-series using $year and $month)
- Resolution metrics report (average resolution time using $subtract and $divide)
- Department performance report (resolution rate using $lookup)
- Admin performance report (per-admin metrics using triple $lookup)
- Admin leaderboard (ranked by average rating)

Status: Completed

## 8. Phase 7 — Frontend Implementation (Completed)

Added in this final milestone, not present in earlier plans.

Deliverables:
- React 18 single-page application scaffolded with Vite
- Tailwind CSS integrated for utility-first styling
- React Router v6 configured with role-based route guards
- Axios instance with request and response interceptors
- Authentication pages: login, registration, email verification
- Student pages: dashboard, my issues, create issue, issue detail, feedback, notifications, profile
- Department admin pages: dashboard, pending approvals, department issues, issue detail, feedback view
- Management pages: dashboard, reports (5 charts), announcements, resource requests
- Super admin pages: cross-campus dashboard, all issues, admin management, leaderboard, flagged feedback
- Recharts integration for data visualizations
- Lucide React icons throughout the interface
- React Hot Toast for user notifications
- Responsive design tested on desktop, tablet, mobile browsers
- Dynamic dropdown loading for categories and departments

Status: Completed

## 9. Phase 8 — Distributed Deployment (Completed)

Deliverables:
- MongoDB Atlas cluster with three-node replica set verified operational
- Automatic failover tested and confirmed
- Backend deployed to Azure Web Apps in Southeast Asia region
- Frontend deployed to Azure Static Web Apps with global CDN
- Environment variables configured through Azure Portal
- CORS configured to allow frontend origin
- Email verification links updated to use environment-based URLs
- HTTPS enforced on all deployed endpoints
- Continuous deployment configured from GitHub

Status: Completed

## 10. Phase 9 — Testing and Validation (Completed)

Deliverables:
- 104 automated Postman tests organized into 14 phases
- Test coverage includes: authentication, issue lifecycle, admin operations, student operations, feedback, notifications, reports, security, role blocking, super admin powers
- Auto-chained tokens and IDs enabling full end-to-end runs
- All tests passing on both local and deployed environments
- Manual testing across all four role interfaces
- Dataset generation script producing 6 campuses, 120 departments, 122 admins, 49,997 students, 70,000 issues, 19,598 feedbacks

Status: Completed

## 11. Phase 10 — Documentation (Completed)

Deliverables:
- Main project README with complete overview
- Backend README with API documentation
- Frontend README with setup instructions
- Architecture documentation
- Database design documentation
- Deployment documentation
- Implementation plan documentation
- Final project report with 20 sections including diagrams and figures
- Postman collection with 104 documented tests

Status: Completed

## 12. Team Contribution

| Team Member | Roll Number | Primary Responsibilities |
|-------------|-------------|--------------------------|
| Muhammad Yasir | NUM-BSCS-2023-37 | Backend architecture, database design, aggregation pipelines, Azure deployment, integration |
| Raza Ullah Khan | NUM-BSCS-2023-28 | Frontend implementation, UI design, testing, dataset generation |

Both team members collaborated on planning, code reviews, and documentation.

## 13. Project Timeline

| Phase | Approximate Duration |
|-------|---------------------|
| Planning and Design (Assignment 1) | 2 weeks |
| Schema Design (Assignment 2) | 2 weeks |
| Backend Prototype (Assignment 3) | 3 weeks |
| Frontend Development | 3 weeks |
| Integration and Deployment | 2 weeks |
| Testing and Documentation | 1 week |
| **Total** | **13 weeks (one semester)** |

## 14. Final Status

All planned phases have been completed successfully. The system is live on Azure and fully operational. Final report submitted for grading in Spring 2026.
