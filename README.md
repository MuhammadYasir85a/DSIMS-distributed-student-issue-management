<div align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=0:0F172A,50:0078D4,100:06B6D4&height=220&section=header&text=DSIMS&fontSize=80&fontColor=ffffff&animation=fadeIn&fontAlignY=38&desc=Distributed%20Student%20Issue%20Management%20System&descAlignY=58&descSize=18" width="100%" />
</div>

<div align="center">
  <img src="https://readme-typing-svg.demolab.com?font=Fira+Code&weight=600&size=22&duration=3500&pause=800&color=06B6D4&center=true&vCenter=true&width=800&height=45&lines=Distributed+Web+Application+on+Microsoft+Azure;MongoDB+Sharding+%2B+Replica+Sets;JWT+Authentication+%2B+Role-Based+Access+Control;Built+with+Node.js+and+Express" alt="Typing SVG" />
</div>

<div align="center">
  <img src="https://img.shields.io/badge/Status-Ongoing-yellow?style=for-the-badge" alt="Status" />
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express" />
  <img src="https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB" />
  <img src="https://img.shields.io/badge/Microsoft_Azure-0078D4?style=for-the-badge&logo=microsoftazure&logoColor=white" alt="Azure" />
  <img src="https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white" alt="JWT" />
</div>

---

## Overview

A scalable distributed web application designed to manage and track student issues at a university. Built using MongoDB sharding and replica sets for high availability, deployed on Microsoft Azure App Service with secure JWT authentication and Role-Based Access Control across three distinct user roles.

This project addresses the lack of a formal issue reporting mechanism in universities by providing a centralized, scalable, and fault-tolerant solution that allows students to report academic, administrative, and infrastructure-related issues in a structured and transparent manner.

---

## Key Features

- Distributed architecture using MongoDB sharding and replica sets
- High availability through automatic failover
- Cloud deployment on Microsoft Azure App Service
- JWT-based authentication for secure access
- Role-Based Access Control across three user roles
- RESTful API design following industry standards
- Strategic indexing on six high-frequency fields for query optimization
- Automated daily backups configured via Azure Resource Groups
- Department-wise issue routing and lifecycle tracking
- Analytical reporting and dashboards for management

---

## Tech Stack

**Backend:**
- Node.js
- Express.js
- Mongoose ORM
- JSON Web Tokens (JWT)
- bcrypt for password hashing

**Database:**
- MongoDB (NoSQL document-oriented)
- MongoDB Atlas (Cloud-hosted)
- Sharding for horizontal scalability
- Replica sets for high availability

**Cloud and DevOps:**
- Microsoft Azure App Service
- Azure Resource Groups
- MongoDB Atlas (Azure Region)
- Git and GitHub

**Tools:**
- Postman for API testing
- VS Code

---

## System Architecture

```
Client Layer (Web Frontend / Mobile UI)
            |
            | HTTPS Request
            v
Application Layer (Node.js + Express API)
            |
            v
Authentication Middleware (JWT + RBAC)
            |
            v
Business Logic (Issue Management Service)
            |
            v
Database Layer
            |
    +-------+-------+
    |               |
    v               v
Shard 1         Shard 2
(Dept-A)        (Dept-B)
    |               |
    v               v
Replica Set     Replica Set
(Primary +      (Primary +
 Secondaries)   Secondaries)
            |
            v
Microsoft Azure Cloud (Hosting + Backups)
```

---

## Project Structure

```
DSIMS-distributed-student-issue-management/
│
├── docs/
│   ├── architecture.md
│   ├── database-design.md
│   ├── implementation-plan.md
│   └── deployment.md
│
├── database/
│   ├── schema/
│   │   ├── students.schema.js
│   │   ├── admins.schema.js
│   │   ├── departments.schema.js
│   │   ├── issues.schema.js
│   │   └── notifications.schema.js
│   │
│   ├── indexes/
│   │   └── index-strategy.md
│   │
│   ├── seed/
│   │   └── seedData.js
│   │
│   └── README.md
│
├── backend/
│   ├── controllers/
│   ├── routes/
│   ├── middleware/
│   ├── services/
│   └── server.js
│
├── frontend/
│   ├── components/
│   ├── pages/
│   └── services/
│
├── .gitignore
├── README.md
└── LICENSE
```

---

## User Roles and Access Control

The system implements Role-Based Access Control (RBAC) across three distinct user roles:

**1. Student**
- Submit and track personal issues
- View issue history and status updates
- Receive notifications

**2. Department Administrator**
- View all issues assigned to their department
- Update issue status and add comments
- Route issues between departments
- Generate department-level reports

**3. University Management**
- Access analytical dashboards
- View university-wide issue statistics
- Monitor department performance
- Generate executive reports

---

## Database Indexing Strategy

Optimized query performance through strategic indexing on six high-frequency fields:

- issue_id
- student_id
- department_id
- status
- category
- created_at

These indexes significantly improve query response time for analytical reports and dashboards.

---

## Distributed Database Concepts

**Replication:**
- MongoDB replica sets maintain multiple data copies
- Ensures high availability and automatic failover
- Continues operation even if a node fails

**Sharding:**
- Data is horizontally partitioned across shards
- Shard key strategy uses department-based and time-based attributes
- Distributes load efficiently and prevents bottlenecks

**Indexing:**
- Strategic indexes on frequently queried fields
- Supports efficient analytical reporting
- Optimizes both read and write performance

---

## Security Features

- JWT-based authentication for stateless sessions
- Secure password hashing with bcrypt
- Role-Based Access Control enforced at API and database levels
- Audit logging for critical operations
- HTTPS-only communication
- Environment variables for sensitive credentials

---

## Installation and Setup

### Prerequisites

- Node.js 16 or higher
- MongoDB 5.0+ (local or MongoDB Atlas)
- Microsoft Azure account (for deployment)
- npm or yarn

### Local Setup

```bash
git clone https://github.com/MuhammadYasir85a/DSIMS-distributed-student-issue-management.git
cd DSIMS-distributed-student-issue-management

cd backend
npm install

cp .env.example .env
```

Configure your .env file with:

```
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
JWT_EXPIRY=7d
```

Run the server:

```bash
node server.js
```

Backend will run on http://localhost:5000

### Database Setup

```bash
cd ../database/seed
node seedData.js
```

This populates the database with sample data for testing.

---

## API Endpoints

### Authentication

- POST /api/auth/register — Register new user
- POST /api/auth/login — Login and receive JWT
- POST /api/auth/logout — Invalidate session

### Issues

- GET /api/issues — List all issues (filtered by role)
- POST /api/issues — Create new issue
- GET /api/issues/:id — Get single issue details
- PUT /api/issues/:id — Update issue status
- DELETE /api/issues/:id — Archive issue

### Reports

- GET /api/reports/department/:id — Department-level analytics
- GET /api/reports/management/dashboard — University-wide dashboard

---

## Testing Strategy

- API testing using Postman collections
- Schema validation testing with Mongoose
- Query and aggregation verification
- Concurrent access testing for distributed scenarios
- Manual UI testing across user roles

---

## Future Enhancements

- Advanced analytics dashboards with real-time data
- Email and push notification system
- Mobile application support (iOS and Android)
- Load testing and auto-scaling configuration
- Integration with university ERP systems
- Multi-language support
- Two-factor authentication

---

## Project Status

**Current Phase:** Ongoing Development

- Database implementation complete
- Backend API development in progress
- Frontend integration pending
- Cloud deployment configuration ongoing

---

## Contributors

- **Muhammad Yasir** — Backend Architect (NUM-BSCS-2023-37)
- **Muhammad Raza** — Co-Developer (NUM-BSCS-2023-28)

---

## Author

**Muhammad Yasir**

Computer Science Undergraduate at Namal University Mianwali  
Aspiring AI and Computer Vision Engineer

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

- Namal University Mianwali for academic guidance
- Course instructor for Advanced Database Management Systems
- MongoDB and Microsoft Azure for excellent documentation
- Open-source community for tools and libraries used

---

## License

This project is licensed under the MIT License.

---

<div align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=0:06B6D4,50:0078D4,100:0F172A&height=120&section=footer" width="100%" />
</div>
