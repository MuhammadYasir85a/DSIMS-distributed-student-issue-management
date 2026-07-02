# DSIMS Backend

Backend API for the Distributed Student Issue Management System (DSIMS). Built with Node.js, Express.js, and MongoDB Atlas. Deployed on Microsoft Azure Web Apps.

## Live API

Base URL: https://dsims-backend-yasir-e4bbgkggesdxdkff.southeastasia-01.azurewebsites.net

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Runtime | Node.js v24 |
| Framework | Express.js v5 |
| Database | MongoDB v7+ |
| ODM | Mongoose v9 |
| Authentication | JWT + bcrypt |
| Security | Helmet, CORS, express-rate-limit |
| Logging | Morgan |
| Hosting | Azure Web Apps |

## Folder Structure

```
backend/
├── config/
│   └── db.js                          MongoDB Atlas connection
├── controllers/
│   ├── auth.controller.js             Login, register, verify email
│   ├── issues.controller.js           Issue CRUD and FSM logic
│   ├── feedback.controller.js         Anonymous feedback system
│   ├── report.controller.js           5 analytics endpoints
│   ├── admin.controller.js            Student approval by admin
│   ├── admin_management.controller.js Super admin operations
│   ├── notification.controller.js     Notification CRUD
│   ├── management.controller.js       Announcements and resource requests
│   ├── category.controller.js         Categories dropdown data
│   ├── department.controller.js       Departments dropdown data
│   └── campus.controller.js           Campus list
├── models/
│   ├── students.model.js
│   ├── admins.model.js
│   ├── issues.model.js
│   ├── feedbacks.model.js
│   ├── notifications.model.js
│   ├── announcements.model.js
│   ├── resourcerequests.model.js
│   ├── departments.model.js
│   ├── campus.model.js
│   └── tokenblacklist.model.js
├── routes/                            API route definitions
├── middleware/
│   ├── auth.middleware.js             JWT verification
│   └── role.middleware.js             Role-based access control
├── utils/
│   └── categories.js                  Category-subcategory mapping
├── seed/
│   └── seedData.js                    Database seeding script
└── server.js                          Application entry point
```

## Prerequisites

- Node.js 18 or higher
- MongoDB Atlas account (free M0 tier works)
- Git

## Installation

Clone the repository and navigate to the backend folder:

```
git clone https://github.com/MuhammadYasir85a/DSIMS-distributed-student-issue-management.git
cd DSIMS-distributed-student-issue-management/backend
```

Install dependencies:

```
npm install
```

## Environment Variables

Create a `.env` file in the backend folder with the following variables:

```
PORT=5000
MONGO_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_jwt_secret_key
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:5000
NODE_ENV=development
```

## Running the Server

Start the server:

```
npm start
```

The server runs at http://localhost:5000

Health check endpoint:

```
GET http://localhost:5000/
```

## Seeding the Database

To populate the database with sample data (6 campuses, 120 departments, 122 admins, 49,997 students, 70,000 issues, 19,598 feedbacks):

```
node seed/seedData.js
```

## API Endpoints Overview

| Category | Base Path | Endpoints |
|----------|-----------|-----------|
| Authentication | /auth | 6 endpoints |
| Issues | /issues | 11 endpoints |
| Feedback | /feedback | 4 endpoints |
| Reports | /reports | 5 endpoints |
| Admin Management | /admins | 4 endpoints |
| Notifications | /notifications | 4 endpoints |
| Announcements | /management | 4 endpoints |
| Utility | /categories, /campuses, /departments | 3 endpoints |

Total: 35+ REST endpoints across 11 controllers.

## Security

- JWT authentication with 1-hour expiry for students and 8-hour for admins
- bcrypt password hashing with 10 salt rounds
- Token blacklisting on logout with TTL auto-cleanup
- Rate limiting: 200 requests per 15 minutes general, 10 per 15 minutes for auth
- Helmet.js adds 11 security headers
- CORS restricted to authorized frontend origin
- Three-layer authorization: authentication, role check, data scoping
- Regex email validation for institutional format
- Environment variables for sensitive credentials

## Database Design

10 MongoDB collections with 38 indexes total. See the main project README for the complete schema and relationships.

Key design decisions:
- Embedded audit trail using `updates[]` array inside issue documents
- Unique index on `feedbacks.issue_id` enforces one feedback per issue
- TTL index on `tokenblacklists.expires_at` auto-deletes expired tokens
- Text index on issue title and description for full-text search
- Compound indexes for common multi-field queries

## Aggregation Pipelines

9 MongoDB aggregation pipelines for real-time analytics:

1. Student Dashboard Stats
2. Admin Dashboard Stats
3. Status Count Report
4. Category Count Report
5. Monthly Trend Report
6. Resolution Metrics
7. Department Performance
8. Admin Performance
9. Admin Leaderboard

## Issue Lifecycle (Finite State Machine)

```
submitted -> under_review -> in_progress -> resolved -> closed
     |            |               |             |
     v            v               v             v
  rejected    rejected        rejected    reopen (max 3x)
```

Terminal states: closed, rejected

## Testing

104 automated Postman tests organized into 14 phases. Import the Postman collection from the `postman/` folder and run using Postman Runner.

## Deployment

Currently deployed on Azure Web Apps with continuous deployment from GitHub. Environment variables are configured through the Azure Portal Configuration settings.

To deploy your own instance:

1. Create an Azure Web App with Node.js runtime
2. Connect to your GitHub repository
3. Configure environment variables in Azure Configuration
4. Enable continuous deployment
5. Ensure MongoDB Atlas network access allows Azure IPs

## Contributors

- Muhammad Yasir (NUM-BSCS-2023-37) - Backend Architecture and Deployment
- Raza Ullah Khan (NUM-BSCS-2023-28) - Testing and Integration

## License

MIT License
