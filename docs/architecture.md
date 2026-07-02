# System Architecture — DSIMS

## 1. Overview

The Distributed Student Issue Management System (DSIMS) follows a three-tier layered architecture with clear separation between presentation, application, and data layers. The system is a production-grade full-stack web application designed for scalability, maintainability, and fault tolerance.

The entire system is deployed on Microsoft Azure with the frontend on Azure Static Web Apps, the backend on Azure Web Apps, and the database on MongoDB Atlas with a three-node replica set. The architecture supports high availability through automatic failover, secure access control through JWT authentication with role-based authorization, and horizontal scalability through Azure's built-in scaling capabilities.

## 2. Architectural Layers

### 2.1 Presentation Layer (Frontend)

- React 18 single-page application built with Vite
- Styled using Tailwind CSS utility-first framework
- Deployed on Azure Static Web Apps with global CDN distribution
- Dedicated interfaces for four user roles: Student, Department Admin, Management, Super Admin
- Communicates with backend via HTTPS requests carrying JWT bearer tokens
- Uses Axios with request and response interceptors for automatic token management
- Uses Recharts for data visualization in dashboards and analytical reports
- Uses React Router v6 for client-side routing with role-based route guards
- Fully responsive design working on desktop, tablet, and mobile browsers

### 2.2 Application Layer (Backend)

- Express.js REST API running on Node.js v24
- Deployed on Azure Web Apps in the Southeast Asia region
- Processes every request through a five-stage middleware pipeline
- Implements 35+ REST endpoints across 11 controllers
- Handles business logic, request validation, and enforces business constraints
- Performs authentication using JWT and password hashing using bcrypt
- Enforces role-based access control at three independent layers
- Interacts with MongoDB via Mongoose ODM

Core components:
- Controllers (business logic)
- Routes (endpoint definitions)
- Middleware (authentication, authorization, security)
- Models (Mongoose schemas)
- Utils (shared helpers like categories map)

Middleware Pipeline (executes in this order):
1. CORS validation
2. Helmet security headers
3. JSON body parser
4. Rate limiter (200 req/15min general, 10 req/15min for auth)
5. Authentication middleware (JWT verification and blacklist check)
6. Role authorization middleware
7. Controller with data scoping

### 2.3 Data Layer (Database)

- MongoDB Atlas managed cloud database
- M0 Free Tier cluster hosted on AWS Singapore region
- Three-node replica set with automatic failover
- 10 collections storing over 141,000 documents totaling 283 MB
- 38 indexes optimizing query performance
- Uses embedded documents for issue audit trails and attachments
- Uses references for relationships between students, departments, admins, and issues
- Implements schema validation, unique constraints, and TTL indexes at the database level

## 3. Distributed Database Design

### 3.1 Replication

The MongoDB Atlas cluster runs a three-node replica set consisting of one primary and two secondary nodes. All writes are directed to the primary node and asynchronously replicated to both secondaries via the oplog. If the primary node becomes unavailable, one of the secondaries is automatically elected as the new primary within approximately 10 seconds. The application reconnects automatically through the SRV connection string without requiring manual intervention. This provides continuous high availability and data safety across three physical locations.

### 3.2 Load Distribution

Load distribution is implemented at multiple levels:

- Database level: Atlas replica set can optionally distribute read operations across secondary nodes
- Infrastructure level: Azure Web Apps includes a built-in load balancer that distributes traffic across multiple backend instances when horizontal scaling is enabled
- CDN level: Azure Static Web Apps serves frontend assets from geographically distributed edge servers
- Application level: Rate limiting acts as protection against overload and abuse

### 3.3 Sharding Consideration

Sharding is not implemented in the current deployment because the total data size of 283 MB does not justify the operational complexity. If the system scales to hundreds of gigabytes in future, sharding would be implemented using `campus_id` as the shard key to align with the multi-tenant access pattern.

## 4. Security Architecture

The system implements defense-in-depth security through multiple layers:

- Password hashing using bcrypt with 10 salt rounds
- JWT-based stateless authentication with 1-hour expiry for students and 8-hour expiry for admins
- Token blacklisting on logout with TTL auto-cleanup preventing token reuse
- Rate limiting at 200 requests per 15 minutes for general endpoints and 10 requests per 15 minutes for authentication endpoints
- Helmet.js middleware adding 11 security-related HTTP headers
- CORS configured to restrict API access to authorized frontend origin only
- Three-layer authorization: authentication middleware, role check middleware, and controller-level data scoping
- Regex email validation for institutional email format
- Search input sanitization escaping regex special characters to prevent ReDoS attacks
- Whitelisted sort fields preventing injection through query parameters
- Environment variables managing all sensitive credentials

## 5. Request Flow

The lifecycle of a typical authenticated request:

1. User performs an action on the React frontend
2. Axios request interceptor attaches the JWT token from localStorage to the Authorization header
3. Request travels over HTTPS to the Azure Web Apps backend
4. CORS middleware verifies the origin is allowed
5. Helmet middleware adds security headers to the response
6. JSON parser converts the request body from string to JavaScript object
7. Rate limiter checks if the client IP has exceeded the request quota
8. Auth middleware extracts the token, verifies its signature, and checks the blacklist
9. Role middleware verifies the authenticated user has permission for the endpoint
10. Controller executes business logic and queries MongoDB with data scoping
11. Response is sent back to the frontend
12. Axios response interceptor catches 401 errors and auto-logs out the user if needed
13. React updates the UI with the new data

## 6. Scalability Considerations

The system is designed to handle significant growth through:

- 38 database indexes covering all high-frequency query patterns
- Pagination cap of 100 items per request preventing server overload
- Lean queries using `.lean()` skipping Mongoose document hydration for 30-40% faster reads
- Selective population fetching only needed fields from related collections
- 9 aggregation pipelines processing analytics directly at the database level
- Compound indexes serving multi-field queries with single index lookups
- Text indexes enabling full-text search without collection scans
- MongoDB Atlas replica set enabling optional read distribution across secondaries
- Azure Web Apps supporting horizontal scaling to multiple instances
- Global CDN reducing frontend load times worldwide

## 7. Deployment Topology

```
Users worldwide
        |
        v
Azure Static Web Apps (Global CDN)
Frontend: React SPA served from nearest edge server
        |
        | HTTPS + JWT
        v
Azure Web Apps (Southeast Asia)
Backend: Node.js + Express API
        |
        | Mongoose SRV Connection
        v
MongoDB Atlas (AWS Singapore)
Primary Node ⇄ Secondary Node 1 ⇄ Secondary Node 2
```

## 8. Technology Rationale

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Frontend Framework | React 18 | Component reusability, mature ecosystem, role-based dashboard architecture |
| Build Tool | Vite | Fast HMR during development, optimized production builds |
| Styling | Tailwind CSS | Rapid UI development without custom CSS files |
| Backend Runtime | Node.js | Event-driven non-blocking I/O suits our concurrent user load |
| Backend Framework | Express.js | Mature middleware ecosystem for security and routing |
| Database | MongoDB | Document model matches our embedded audit trail requirements |
| ODM | Mongoose | Schema enforcement on top of MongoDB's flexibility |
| Auth | JWT | Stateless authentication scales horizontally without shared session store |
| Frontend Hosting | Azure Static Web Apps | Free CDN and GitHub integration |
| Backend Hosting | Azure Web Apps | Managed Node.js runtime with auto-scaling |
| Database Hosting | MongoDB Atlas | Managed replica set with zero maintenance |
