## Running with Docker Compose

docker-compose up --build

- Frontend: http://localhost:5173
- Backend: http://localhost:5000
- MongoDB: internal, persisted in a named Docker volume



# TaskFlow – MERN Task Manager with CI/CD

A beginner-to-practical MERN stack project: React + Node.js + Express + MongoDB,
containerized with Docker, orchestrated with Docker Compose, and automated with
GitHub Actions CI/CD.

## Getting started (local, no Docker yet)

### Backend
```
cd backend
npm install
npm run dev
```
Runs on http://localhost:5000

### Frontend
```
cd frontend
npm install
npm run dev
```
Runs on http://localhost:5173

Make sure MongoDB is running locally before starting the backend
(`MONGO_URI` in `backend/.env` points to `mongodb://localhost:27017/taskflow`).

## Tech stack
- React (Vite)
- Node.js + Express
- MongoDB (Mongoose)
- Docker & Docker Compose
- GitHub Actions (CI/CD)
- Docker Hub
- AWS EC2 + Nginx (planned)

## Features

TaskFlow is a small internal task manager for a team. There is no account-wide role: your role is decided
**per workspace**. Whoever creates a workspace is its **team lead**; everyone else in it is a **member**.

- **Team lead (of a workspace)** adds members, creates and assigns tasks, and tracks progress.
- **Member** sees the tasks assigned to them and updates their status.
- The same person can be a team lead in one workspace and a member in another. Leading one workspace gives no power over any other.

- **Auth**: sign up, log in, log out, protected pages (JWT). Anyone can sign up and create workspaces.
- **Workspaces**: a name, a description, an owner (the team lead who created it) and members.
- **Team**: the team lead adds members by email (they must already have an account) and can remove them again.
- **Tasks**: title, description, workspace, assignee, status (To do / In progress / Completed) and due date.
  The assignee must be a member of the task's workspace.
- **Dashboard** (one for everyone): if you own workspaces you see total workspaces, team members, tasks, completed tasks, recent
  workspaces and tasks; if tasks are assigned to you in other workspaces you also see my tasks, in progress, completed.
  A new user with neither sees a "Create workspace" button.
- **Tasks page**: every task in the workspaces you lead, plus every task assigned to you (search, workspace and status filters).
- **Who is the team lead?** The workspace owner (`workspace.owner`). The backend works this out and sends
  `isLead` with every workspace/task response; the frontend uses that flag instead of comparing owner ids itself.

Accounts created with an older version may still have a `role` field in MongoDB. It is ignored.

### Who can do what (enforced by the API, not just the UI)

| Action | Team lead (owner of the workspace) | Member of the workspace |
| ------ | :--------------------------------: | :---------------------: |
| Create a workspace | any logged-in user | any logged-in user |
| Add / remove workspace members | yes | no (403) |
| Create, edit, delete, assign tasks | yes | no (403) |
| View all tasks in the workspace | yes | no - only tasks assigned to them |
| Change a task's status | yes | only their own tasks |

Someone who is not in a workspace gets `403` for it; a missing workspace or task gets `404`.
Removing a member only removes them from the workspace: their account is kept and their tasks stay (they become unassigned).

## Project structure

```
backend/src
  config/db.js            MongoDB connection
  middleware/auth.js      JWT check (requireAuth)
  models/                 User, Workspace, Task
  controllers/            workspaceController, taskController
  routes/                 authRoutes, workspaceRoutes, taskRoutes
  utils/access.js         isLead / isMember (the permission rules)
  utils/handleError.js    turns errors into JSON responses
  server.js               Express app

frontend/src
  pages/                  Login, Signup, Dashboard, Workspaces, WorkspaceDetail,
                          Tasks, TaskDetail, TaskFormPage
  components/             Layout (sidebar), TaskCard, TaskForm, TaskFilters, MembersPanel,
                          WorkspaceForm, ConfirmDialog, Badges, Feedback
  services/               api.js (shared fetch helper), authApi, taskApi, workspaceApi
  hooks/useFetch.js       loading / error handling for data fetching
  utils/                  constants (statuses, priorities) and date formatting
  context/AuthContext.jsx login state
```

## API

All routes except `/api/auth/*` and `/health` need the header `Authorization: Bearer <token>`.

| Method | Route | Who | Purpose |
| ------ | ----- | --- | ------- |
| POST | `/api/auth/register` | anyone | Create an account |
| POST | `/api/auth/login` | anyone | Log in |
| GET | `/api/workspaces` | logged in | Workspaces I lead or belong to (with `taskCount` and `members`) |
| POST | `/api/workspaces` | logged in | Create a workspace (I become its team lead) |
| GET | `/api/workspaces/:id` | member | Get one workspace |
| POST | `/api/workspaces/:id/members` | workspace owner | Add a member by `email` |
| DELETE | `/api/workspaces/:id/members/:userId` | workspace owner | Remove a member |
| GET | `/api/tasks` | logged in | Tasks in workspaces I own + tasks assigned to me. Optional query: `search`, `status`, `workspace`, `assigned=me` |
| POST | `/api/tasks` | workspace owner | Create a task (`assignee` optional) |
| GET | `/api/tasks/:id` | member | Get one task |
| PUT | `/api/tasks/:id` | workspace owner, or assignee (status only) | Update a task |
| DELETE | `/api/tasks/:id` | workspace owner | Delete a task |
| GET | `/health` | anyone | Health check |

Task `status` values: `todo`, `in-progress`, `completed`.
