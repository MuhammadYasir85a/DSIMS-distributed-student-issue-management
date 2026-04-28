Database Design – DSIMS
1. Overview
The Distributed Student Issue Management System (DSIMS) uses MongoDB, a document-oriented NoSQL database. The schema design follows a hybrid modeling approach that combines embedded documents and references to achieve flexibility, performance, and scalability.

The database is implemented using Mongoose with strict validation rules, enumerations, and indexed fields to ensure data integrity and performance optimization.

2. Collections
The system contains the following collections:

students
departments
admins
issues
notifications
3. Collection Design
3.1 Students Collection
Stores registered student accounts.

Fields:

student_id (unique)
name
email (unique)
password_hash
department_id (reference to departments)
semester
contact_no
role (default: student)
status (active/inactive)
created_at
Validation:

email is unique and required
password_hash is required
semester restricted between valid range
status restricted to predefined values
3.2 Departments Collection
Stores academic or administrative department information.

Fields:

name
type (academic/administrative/support)
email (unique)
office_location
created_at
Validation:

type restricted using enum
email unique and required
3.3 Admins Collection
Stores department administrators and management-level users.

Fields:

name
email (unique)
password_hash
role (department_admin / management / super_admin)
department_id (nullable reference to departments)
status
created_at
Validation:

role restricted using enum
department_id optional for management/super admins
3.4 Issues Collection
This is the core collection of DSIMS.

Fields:

title
description
category
priority (low / medium / high / urgent)
status (submitted → under_review → in_progress → resolved → closed / rejected)
student_id (reference to students)
department_id (reference to departments)
assigned_to_admin_id (nullable reference to admins)
is_anonymous
attachments (embedded array)
updates (embedded array)
resolution_summary
createdAt
updatedAt
Design Patterns Used:

Embedded Document Pattern (updates, attachments)
Reference Pattern (student_id, department_id, assigned_to_admin_id)
State Transition Pattern (issue lifecycle)
Audit Trail Pattern (updates array)
3.5 Notifications Collection
Stores alerts related to issue activities.

Fields:

recipient_id
recipient_role
issue_id (reference to issues)
message
is_read
created_at
Validation:

recipient_role restricted using enum
issue_id required
4. Embedded vs Referenced Data Decisions
Embedded Data
updates
attachments
Reason:

Directly associated with a single issue
Frequently accessed together
Improves read performance
Referenced Data
student_id
department_id
assigned_to_admin_id
issue_id (in notifications)
Reason:

Avoid duplication
Maintain normalization-like structure
Allow independent updates
5. Indexing Strategy
Indexes are applied on:

student_id
department_id
status
category
created_at
assigned_to_admin_id
email fields (students & admins)
Compound indexes may be applied for:

department_id + status
student_id + created_at
6. Distributed Database Readiness
The system is designed to support:

Replica Sets for high availability
Sharding using department-based or time-based shard keys
Horizontal scalability for large issue volumes