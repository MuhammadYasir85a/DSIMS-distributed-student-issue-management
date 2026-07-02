# DSIMS Frontend

React-based single-page application for the Distributed Student Issue Management System (DSIMS). Built with React 18, Vite, and Tailwind CSS. Deployed on Microsoft Azure Static Web Apps.

## Live Application

URL: https://white-beach-01486ac00.7.azurestaticapps.net

## Tech Stack

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
| Hosting | Azure Static Web Apps |

## Folder Structure

```
frontend/
├── src/
│   ├── components/          Reusable UI components (sidebar, cards, modals)
│   ├── pages/
│   │   ├── student/         Student dashboard, issues, profile
│   │   ├── admin/           Admin dashboard, pending students, department issues
│   │   ├── management/      Reports, announcements, resource requests
│   │   └── superadmin/      Cross-campus dashboard, admin management, leaderboard
│   ├── services/
│   │   └── api.js           Axios instance with interceptors
│   ├── contexts/            React context providers
│   ├── App.jsx              Main application component with routing
│   └── main.jsx             Entry point
├── public/                  Static assets
├── vite.config.js           Vite configuration
├── tailwind.config.js       Tailwind configuration
├── index.html               HTML entry point
└── package.json
```

## Prerequisites

- Node.js 18 or higher
- npm or yarn
- Running backend server (local or deployed)

## Installation

Clone the repository and navigate to the frontend folder:

```
git clone https://github.com/MuhammadYasir85a/DSIMS-distributed-student-issue-management.git
cd DSIMS-distributed-student-issue-management/frontend
```

Install dependencies:

```
npm install
```

## Environment Variables

Create a `.env` file in the frontend folder:

```
VITE_API_URL=http://localhost:5000
```

For production deployment, set this to the deployed backend URL:

```
VITE_API_URL=https://dsims-backend-yasir-e4bbgkggesdxdkff.southeastasia-01.azurewebsites.net
```

## Running the Development Server

Start the development server with hot reload:

```
npm run dev
```

The application runs at http://localhost:5173

## Building for Production

Create an optimized production build:

```
npm run build
```

The build output is placed in the `dist/` folder, ready for deployment to any static hosting service.

Preview the production build locally:

```
npm run preview
```

## Application Features by Role

### Student

- Registration with institutional email verification
- Personal dashboard with issue statistics and charts
- Create new issues with dynamic category and department dropdowns
- View issue history with complete status timeline
- Edit or delete own issues (only in submitted state)
- Reopen resolved issues with mandatory reason
- Submit anonymous 1-to-5 star feedback
- View and manage notifications
- Profile and password management

### Department Admin

- Department dashboard with status and priority breakdown
- Pending student approvals queue
- Issue management with search, filter, sort
- Status update with FSM-enforced valid transitions
- View anonymous feedback and performance summary
- Submit resource requests to management

### Management

- Campus-wide analytics with 5 interactive report charts
- Announcement creation targeting specific audiences
- Resource request review and approval workflow

### Super Admin

- Cross-campus dashboard with system-wide statistics
- All-issues view with cross-campus filtering
- Admin account management (suspend, reactivate)
- Admin leaderboard by feedback rating
- Flagged feedback review for escalated cases

## Key Implementation Details

### API Communication

Axios instance in `services/api.js` includes two interceptors:

- Request interceptor automatically attaches JWT token from localStorage
- Response interceptor catches 401 errors and auto-logs out the user

### Authentication Flow

- User credentials stored in localStorage under keys `dsims_token` and `dsims_user`
- Route guards check role before rendering protected pages
- Automatic redirect to login on expired sessions
- Role-based dashboard routing after successful login

### Dynamic Form Data

Categories and departments are fetched from the backend on component mount rather than hardcoded. This ensures the frontend always reflects the current server state.

### Charts and Visualizations

Recharts library powers all dashboard visualizations:
- Bar charts for status distribution
- Line charts for monthly trends
- Pie charts for category breakdown
- Composed charts for department performance

## Responsive Design

The application is fully responsive and works on desktop, tablet, and mobile browsers. Tailwind CSS utility classes handle breakpoints throughout the codebase.

## Deployment

Currently deployed on Azure Static Web Apps with continuous deployment from GitHub via GitHub Actions.

To deploy your own instance:

1. Create an Azure Static Web App resource
2. Connect to your GitHub repository
3. Set build configuration:
   - App location: `/frontend`
   - Output location: `dist`
   - Build command: `npm run build`
4. Configure environment variable `VITE_API_URL` in Azure Configuration
5. GitHub Actions will handle automatic deployment on every push

## Contributors

- Raza Ullah Khan (NUM-BSCS-2023-28) - Frontend Implementation and UI Design
- Muhammad Yasir (NUM-BSCS-2023-37) - Frontend-Backend Integration

## License

MIT License
