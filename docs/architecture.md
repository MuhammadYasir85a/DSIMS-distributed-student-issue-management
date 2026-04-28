System Architecture – DSIMS
1. Overview
The Distributed Student Issue Management System (DSIMS) follows a layered and modular architecture to ensure scalability, maintainability, and separation of concerns. The system is designed as a distributed web-based application using MongoDB as the database layer and Node.js with Express as the backend API layer.

The architecture supports high availability, horizontal scalability, and secure access control.

2. Architectural Layers
The system consists of the following layers:

2.1 Client Layer (Frontend)
Web-based user interface
Allows students, administrators, and management users to interact with the system
Communicates with backend via RESTful APIs
Handles user input and displays issue tracking information
2.2 Application Layer (Backend)
Built using Node.js and Express
Implements RESTful API endpoints
Handles business logic and request validation
Performs authentication and authorization using JWT
Enforces Role-Based Access Control (RBAC)
Interacts with MongoDB via Mongoose
Core components:

Controllers
Routes
Middleware
Models
2.3 Database Layer
MongoDB document-oriented database
Uses embedded documents for issue updates and attachments
Uses references for student, department, and admin relationships
Implements validation rules and indexing strategies
Designed to support distributed database mechanisms
3. Distributed Architecture Design
DSIMS is designed to support distributed database concepts:

3.1 Replication
MongoDB Replica Sets provide multiple copies of data
Ensures high availability
Automatic failover in case of primary node failure
3.2 Sharding
Horizontal partitioning of issue data
Shard key based on department_id or time-based attribute
Improves scalability and performance
4. Security Architecture
The system enforces secure access through:

Password hashing using bcrypt
JWT-based authentication
Role-Based Access Control (RBAC)
Protected API routes
Audit logging through embedded updates
5. Request Flow
The general request lifecycle is:

User sends request from frontend
Backend validates JWT token
Role middleware checks permissions
Controller processes request
Mongoose interacts with MongoDB
Response sent back to client
6. Scalability Considerations
The system is designed to handle growth through:

Indexing on frequently queried fields
Pagination for large result sets
Aggregation pipelines for reporting
Distributed database deployment on MongoDB Atlas