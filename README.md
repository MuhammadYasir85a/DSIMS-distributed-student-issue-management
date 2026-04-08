# Distributed Student Issue Management System (DSIMS)

##  Project Overview
The Distributed Student Issue Management System (DSIMS) is a web-based application designed to allow university students to report, track, and manage academic, administrative, and infrastructure-related issues in a structured and transparent manner. The system addresses the lack of a formal issue reporting mechanism in universities by providing a centralized, scalable, and fault-tolerant solution.

The system is built using a distributed NoSQL database (MongoDB) and is deployed on the Microsoft Azure cloud platform to ensure scalability, high availability, and reliability. This project is developed as part of the **Advanced Database Management Systems** course and focuses on applying real-world distributed database concepts in an academic environment.



##  Objectives
- Provide a centralized platform for students to submit and track issues
- Improve transparency in issue handling and resolution
- Enable department administrators to manage complaints efficiently
- Offer university management analytical insights through reports
- Demonstrate distributed database concepts such as replication and sharding
- Ensure scalability, performance optimization, and fault tolerance



##  System Architecture
The system follows a **layered architecture**:

- **Client Layer**  
  Web-based frontend for students, department administrators, and management.

- **Application Layer**  
  Backend RESTful APIs developed using Node.js and Express, responsible for business logic, authentication, and authorization.

- **Database Layer**  
  Distributed MongoDB database implemented using replication and sharding to support scalability and availability.



##  Database Technology
- **MongoDB** (Document-Oriented NoSQL Database)
- Supports semi-structured data and flexible schema design
- Provides built-in replication and sharding
- Efficiently handles concurrent access and large datasets
- Ideal for issue records containing dynamic fields such as updates and attachments


##  Cloud Deployment
- **Microsoft Azure** is used to host the backend application using Azure App Service.
- **MongoDB Atlas (Azure Region)** is used for cloud-based distributed database deployment.
- Provides automatic backups, monitoring, and failover support.


##  Distributed Database Concepts Implemented

###  Replication
- MongoDB replica sets are used to maintain multiple copies of data.
- Ensures high availability and automatic failover in case of node failure.

###  Sharding
- Data is horizontally partitioned across shards to improve scalability.
- Shard key strategy is designed using department-based and time-based attributes.
- Helps distribute load efficiently and avoid performance bottlenecks.

###  Indexing & Performance Optimization
Indexes are applied on frequently queried fields including:
- issue_id
- student_id
- department_id
- status
- category
- created_at

This improves query performance and supports efficient reporting and analytics.


##  Technology Stack

### Backend
- Node.js
- Express.js
- MongoDB
- Mongoose
- JSON Web Tokens (JWT)

### Frontend
- Web-based client (HTML/CSS/JavaScript or React)
- RESTful API integration

### Database
- MongoDB (NoSQL, document-oriented)
- MongoDB Atlas (Cloud-based distributed database)

### DevOps / Cloud
- Git & GitHub (Version Control)
- Microsoft Azure (Backend Hosting)
- MongoDB Atlas (Azure Region)


##  Security & Access Control
- Role-Based Access Control (RBAC)
  - Student
  - Department Administrator
  - University Management
- JWT-based authentication
- Secure password hashing
- Audit logging for critical operations


##  Key Features
- Issue submission and tracking
- Department-wise complaint routing
- Issue lifecycle and status history
- Notification system for updates
- Analytical reports and dashboards for management


##  Testing Strategy
- API testing using Postman
- Schema validation testing
- Query and aggregation verification
- Conceptual concurrent access testing


##  Project Structure
DSIMS-distributed-student-issue-management/
│
├── docs/                          # Technical and academic documentation
│   ├── architecture.md
│   ├── database-design.md
│   ├── implementation-plan.md
│   └── deployment.md
│
├── database/                      # Database layer
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
├── backend/                       # Application layer
│├── frontend/                     # Client layer
│
├── .gitignore
├── README.md
└── LICENSE

---

##  Future Enhancements
- Advanced analytics dashboards
- Email and push notifications
- Mobile application support
- Load testing and auto-scaling
- Integration with university ERP systems


##  Project Status
 **In Progress**

Current Phase:
- Database implementation
- Backend API development


##  Contributors
- **Muhammad Yasir** (NUM-BSCS-2023-37)
- **Muhammad Raza** (NUM-BSCS-2023-28)


##  License
This project is licensed under the MIT License.
