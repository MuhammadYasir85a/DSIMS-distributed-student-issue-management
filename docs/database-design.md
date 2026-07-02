# Database Design — DSIMS

## 1. Overview

The Distributed Student Issue Management System (DSIMS) uses MongoDB, a document-oriented NoSQL database, hosted on MongoDB Atlas with a three-node replica set. The schema follows a hybrid modeling approach combining embedded documents and references to achieve flexibility, performance, and scalability.

The database is implemented using Mongoose ODM with strict validation rules, enumerations, unique constraints, TTL indexes, and 38 total indexes for query optimization. The final deployed system contains 10 collections holding over 141,000 documents totaling 283 MB of production-ready data.

## 2. Collections Summary

| Collection | Documents | Storage | Purpose |
|------------|-----------|---------|---------|
| campuses | 6 | 36 KB | University campus locations |
| departments | 120 | 49 KB | 20 departments per campus |
| admins | 122 | 45 KB | Department admins, management, super admins |
| students | 49,997 | 4.01 MB | Enrolled students with verified emails |
| issues | 70,000 | 20.75 MB | Student complaints with embedded audit trail |
| feedbacks | 19,598 | 1.85 MB | Anonymous ratings of admin performance |
| notifications | 1,000 | 118 KB | Event-driven messages for all roles |
| announcements | 1 sample | 36 KB | Top-down broadcasts from management |
| resourcerequests | 1 sample | 36 KB | Department resource and budget requests |
| tokenblacklists | Dynamic | 24 KB | Invalidated JWT tokens with TTL auto-cleanup |

## 3. Collection Design

### 3.1 Campuses Collection

Root tenant entity. All other collections reference a campus for multi-tenant scoping.

Fields:
- `_id` — ObjectId primary key
- `name` — Unique campus name
- `location` — Campus location
- `status` — Enum: active, inactive
- `created_at`, `updated_at`

### 3.2 Departments Collection

Represents academic, support, and administrative departments within each campus. Each campus has 20 departments split across types.

Fields:
- `_id` — ObjectId primary key
- `name` — Department name
- `type` — Enum: academic, support, administrative
- `office_location` — Unique location
- `campus_id` — Reference to campus
- `created_at`, `updated_at`

### 3.3 Students Collection

Stores registered student accounts. Separate from admins due to distinct fields, authentication flows, and lifecycle management.

Fields:
- `_id`
- `student_id` — University roll number (unique)
- `name`
- `email` — Unique, validated against institutional regex format
- `password_hash` — bcrypt hashed with 10 salt rounds
- `campus_id` — Reference to campus
- `department_id` — Reference to department
- `semester` — Number 1 to 12
- `contact_no`
- `role` — Fixed as student
- `status` — Enum: pending, active, rejected
- `is_email_verified` — Boolean
- `verification_token`, `verification_token_expires`
- `last_login`

### 3.4 Admins Collection

Stores three types of admin accounts: department admins, management users, and super admins.

Fields:
- `_id`
- `name`
- `email` — Unique
- `password_hash` — bcrypt hashed
- `role` — Enum: dept_admin, management, super_admin
- `campus_id` — Reference to campus
- `department_id` — Nullable, only required for dept_admin
- `status` — Enum: active, suspended
- `reset_password_token`, `reset_password_expires`
- `last_login`

### 3.5 Issues Collection

The central business entity of DSIMS. Contains 70,000 documents with the most complex schema in the system.

Fields:
- `_id`
- `title` — 5 to 150 characters
- `description` — Minimum 20 characters
- `primary_category` — One of 8 predefined categories
- `subcategory` — Validated against category map
- `priority` — Enum: low, medium, high, urgent
- `status` — Enum representing the 6-state finite state machine
- `campus_id` — Reference to campus
- `student_id` — Reference to student who created
- `department_id` — Reference to responsible department
- `assigned_to_admin_id` — Nullable reference to admin handling the issue
- `resolution_summary` — Minimum 30 characters when resolved
- `is_anonymous` — Boolean flag for privacy
- `updates` — Embedded array of status change history
- `attachments` — Embedded array of file metadata

Embedded `updates[]` sub-document:
- `updated_by` — Reference to student or admin
- `updater_role` — Enum: student, dept_admin, super_admin
- `message` — Change description
- `old_status`, `new_status`
- `timestamp`

Embedded `attachments[]` sub-document:
- `file_name`, `file_url`, `file_type`, `uploaded_at`

Design Patterns Applied:
- Embedded Document Pattern for updates and attachments
- Reference Pattern for user and organizational entities
- State Transition Pattern for issue lifecycle
- Audit Trail Pattern for complete change history

### 3.6 Feedbacks Collection

Anonymous rating system that holds admins accountable. Enforces one feedback per issue at the database level through a unique constraint.

Fields:
- `_id`
- `issue_id` — Unique reference to issue (one-to-one)
- `student_id` — Reference to student (hidden from department admin)
- `admin_id` — Reference to admin being rated
- `issue_final_status` — Enum: resolved, closed, rejected
- `rating` — Number 1 to 5
- `was_actually_resolved` — Boolean student verification
- `comment` — Maximum 2000 characters
- `flag_for_review` — Boolean
- `requires_super_admin_attention` — Auto-set when rating is 2 or below
- `super_admin_reviewed` — Boolean
- `super_admin_notes`
- `reviewed_by` — Nullable reference to super admin
- `reviewed_at`
- `campus_id`, `department_id`

### 3.7 Notifications Collection

Event-driven notifications for all user roles. Uses polymorphic recipient_id since notifications can be sent to either students or admins.

Fields:
- `_id`
- `recipient_id` — Polymorphic reference to student or admin
- `recipient_role` — Enum: student, dept_admin, management, super_admin
- `issue_id` — Nullable reference to issue
- `message`
- `is_read` — Boolean

### 3.8 Announcements Collection

New collection for management and super admin to broadcast messages to specific audiences.

Fields:
- `_id`
- `title` — 5 to 200 characters
- `content` — Minimum 10 characters
- `created_by` — Reference to admin
- `creator_role` — Enum: management, super_admin
- `target_audience` — Enum: all, students, admins, dept_admins, management
- `campus_id` — Nullable (null means all campuses)
- `department_id` — Nullable
- `priority`
- `expires_at`
- `is_active` — Boolean
- `read_by` — Embedded array of user IDs

### 3.9 Resource Requests Collection

New collection allowing department admins to formally request resources from management.

Fields:
- `_id`
- `title`, `description`, `justification`
- `requested_by` — Reference to department admin
- `department_id`, `campus_id`
- `resource_type` — Enum: equipment, budget, staffing, infrastructure, software
- `estimated_cost`, `urgency`
- `status` — Enum representing 5-state approval lifecycle
- `reviewed_by` — Nullable reference to management admin
- `review_notes`, `reviewed_at`
- `updates` — Embedded review history

### 3.10 Token Blacklist Collection

Stores invalidated JWT tokens to prevent reuse after logout. Uses a TTL index for automatic cleanup.

Fields:
- `_id`
- `token` — Unique indexed JWT
- `user_id` — Polymorphic reference
- `expires_at` — TTL indexed for auto-deletion
- `created_at`

## 4. Embedded vs Referenced Data Decisions

### Embedded Data

- `updates` array inside issues
- `attachments` array inside issues
- `read_by` array inside announcements

Rationale:
- Always read together with the parent document
- Never queried independently
- Improves read performance by avoiding joins
- Ensures atomic writes at the document level

### Referenced Data

- `student_id`, `department_id`, `admin_id`, `campus_id` across collections

Rationale:
- Entities exist independently of parent
- Prevents data duplication
- Allows independent updates
- Enables normalization-like structure

## 5. Indexing Strategy (38 Total Indexes)

### Issues Collection (7 indexes)

- `{ campus_id: 1 }` — Multi-tenant scoping applied to every query
- `{ department_id: 1, status: 1 }` — Compound index for admin filtering
- `{ student_id: 1 }` — Student retrieving own issues
- `{ createdAt: -1 }` — Default sort order (newest first)
- `{ campus_id: 1, primary_category: 1 }` — Category reports per campus
- `{ primary_category: 1, subcategory: 1 }` — Drill-down category reports
- `{ title: "text", description: "text" }` — Full-text search

### Feedbacks Collection (7 indexes)

- `{ issue_id: 1 }` unique — Enforces one feedback per issue
- `{ admin_id: 1, createdAt: -1 }` — Admin's feedback history
- `{ requires_super_admin_attention: 1 }` — Escalation queue
- Additional indexes on campus_id, department_id, rating, super_admin_reviewed

### Students Collection (4 indexes)

- `{ email: 1 }` unique
- `{ student_id: 1 }` unique
- `{ campus_id: 1 }`
- `{ department_id: 1 }`

### Admins Collection (3 indexes)

- `{ email: 1 }` unique
- `{ role: 1 }`
- `{ campus_id: 1 }`

### Token Blacklist (3 indexes)

- `{ token: 1 }` unique
- `{ user_id: 1 }`
- `{ expires_at: 1 }` TTL — Auto-deletes expired tokens

### Notifications (3 indexes)

- `{ recipient_id: 1 }`
- `{ is_read: 1 }`
- `{ createdAt: -1 }`

### Departments (3 indexes)

- `{ office_location: 1 }` unique
- `{ campus_id: 1 }`
- `{ type: 1 }`

### Campuses (2 indexes)

- `_id` (default)
- `{ name: 1 }` unique

### Announcements and Resource Requests

- Standard indexes on campus_id, created_by, status, and timestamp fields

## 6. Aggregation Pipelines

Nine aggregation pipelines power the analytics and reporting features:

1. Student Dashboard Stats — Issue counts by status for a student
2. Admin Dashboard Stats — Status and priority counts for a department
3. Status Count Report — Cross-campus status distribution
4. Category Count Report — Issues grouped by category and subcategory
5. Monthly Trend — Time-series analysis using $year and $month
6. Resolution Metrics — Average resolution time using $subtract and $divide
7. Department Performance — Resolution rate per department using $lookup
8. Admin Performance — Per-admin metrics using triple $lookup
9. Admin Leaderboard — Admins ranked by average rating

Stages used include $match, $group, $lookup, $project, $sort, $count, $sum, $avg, $subtract, $divide, $year, $month.

## 7. Constraints and Validations

### Schema-Level (Mongoose)

- Unique constraints on emails, student_id, issue_id in feedback
- Enum values for roles, statuses, priorities, types
- Range validators for semester (1-12) and rating (1-5)
- Regex validation for institutional email format
- Required fields enforced
- Default values for booleans and timestamps

### Controller-Level Business Rules

- Resolution summary minimum 30 characters
- Rejection reason minimum 20 characters
- Edit reason minimum 15 characters
- Delete reason minimum 20 characters
- Issue must be assigned to admin before marking in-progress
- Department must belong to student's campus
- Maximum 3 reopens per issue
- Cannot suspend the last active super admin
- Terminal states (closed, rejected) block further modifications

## 8. Distributed Database Deployment

The database is deployed on MongoDB Atlas M0 Free Tier on AWS Singapore region with:

- Three-node replica set with automatic failover
- Primary node handles all writes, secondaries provide redundancy
- Failover election completes in approximately 10 seconds
- SRV connection string auto-discovers all replica set members
- Application reconnects automatically without manual intervention
- 512 MB storage capacity with 283 MB currently used

Sharding is not implemented due to current data volume. If the system grows to hundreds of gigabytes, sharding would use `campus_id` as the shard key to align with multi-tenant access patterns.

## 9. Data Integrity Guarantees

- ACID guarantees at single-document level (MongoDB atomic writes)
- Multi-document consistency through embedded document design
- Referential integrity enforced at application layer
- Unique constraints enforced at database level
- TTL indexes provide automatic data lifecycle management
- Immutable audit trail through embedded updates array
