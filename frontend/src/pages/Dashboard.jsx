import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import useFetch from "../hooks/useFetch";
import { fetchTasks } from "../services/taskApi";
import { fetchWorkspaces } from "../services/workspaceApi";
import TaskCard from "../components/TaskCard";
import WorkspaceProgress from "../components/WorkspaceProgress";
import { EmptyState, ErrorMessage, Loading } from "../components/Feedback";

// One dashboard for everyone. What you see depends on what you have, not on an account role:
//   - workspaces you own      -> the "lead" section (stats, workspaces, recent tasks)
//   - tasks assigned to you in workspaces you don't own -> the "my tasks" section
//   - neither                 -> a short empty state with a "Create workspace" button
export default function Dashboard() {
  const { user } = useAuth();
  const firstName = user?.name?.split(" ")[0];

  const { data, loading, error, reload } = useFetch(async () => {
    const [workspaces, tasks] = await Promise.all([fetchWorkspaces(), fetchTasks()]);
    return { workspaces, tasks };
  }, []);

  const ledWorkspaces = (data?.workspaces || []).filter((w) => w.isLead);
  const allTasks = data?.tasks || [];
  // Tasks in workspaces I lead vs. tasks assigned to me in someone else's workspace
  const ledTasks = allTasks.filter((t) => t.workspace?.owner === user?.id);
  const assignedTasks = allTasks.filter((t) => t.workspace?.owner !== user?.id);

  const showLead = ledWorkspaces.length > 0;
  const showMine = assignedTasks.length > 0;

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Welcome back, {firstName},👋</h1>
          <p className="page-subtitle">
            {showLead || !showMine
              ? "Here is how your workspaces and tasks are going."
              : "Here is the work assigned to you."}
          </p>
        </div>
      </div>

      {loading && <Loading />}
      {error && <ErrorMessage message={error} onRetry={reload} />}

      {!loading && !error && !showLead && !showMine && (
        <EmptyState
          title="Start your first workspace"
          text="Create a workspace to add members and assign tasks. Or wait for a team lead to add you."
          action={<Link to="/workspaces" className="btn btn-primary">Create workspace</Link>}
        />
      )}

      {!loading && !error && showLead && (
        <LeadSection
          workspaces={ledWorkspaces}
          tasks={ledTasks}
          label={showMine ? "Workspaces you lead" : null}
        />
      )}

      {!loading && !error && showMine && (
        <MySection tasks={assignedTasks} label={showLead ? "Assigned to you in other workspaces" : null} />
      )}
    </>
  );
}

// ---- Workspaces you lead: members and tasks you manage -----------------------
function LeadSection({ workspaces, tasks, label }) {
  // Distinct people across the led workspaces, not counting each workspace's lead
  const memberIds = new Set();
  workspaces.forEach((w) =>
    w.members.forEach((m) => {
      if (m._id !== w.owner) memberIds.add(m._id);
    })
  );

  const totalTasks = tasks.length;
  const completed = tasks.filter((t) => t.status === "completed").length;

  return (
    <>
      {label && <p className="section-label">{label}</p>}

      <div className="stat-grid">
        <div className="stat">
          <div className="stat-value">{workspaces.length}</div>
          <div className="stat-label">Total workspaces</div>
        </div>
        <div className="stat">
          <div className="stat-value">{memberIds.size}</div>
          <div className="stat-label">Team members</div>
        </div>
        <div className="stat">
          <div className="stat-value">{totalTasks}</div>
          <div className="stat-label">Total tasks</div>
        </div>
        <div className="stat">
          <div className="stat-value">{completed}</div>
          <div className="stat-label">Completed tasks</div>
        </div>
      </div>

      <div className="section-header">
        <h2>Workspaces</h2>
        <Link to="/workspaces" className="link">View all workspaces</Link>
      </div>
      <div className="workspace-grid">
        {workspaces.slice(0, 3).map((w) => (
          <Link key={w._id} to={`/workspaces/${w._id}`} className="workspace-card">
            <h2>{w.name}</h2>
            <WorkspaceProgress completed={w.completedCount} total={w.taskCount} />
            <div className="workspace-footer">
              <span>{w.taskCount} {w.taskCount === 1 ? "task" : "tasks"}</span>
              <span>{w.members.length-1} {w.members.length-1 === 1 ? "member" : "members"}</span>
            </div>
          </Link>
        ))}
      </div>

      <div className="section-header">
        <h2>Recent tasks</h2>
        {totalTasks > 0 && <Link to="/tasks" className="link">View all tasks</Link>}
      </div>
      {totalTasks === 0 ? (
        <EmptyState title="No tasks yet" text="Tasks you create will show up here." />
      ) : (
        <div className="task-list">
          {tasks.slice(0, 5).map((task) => (
            <TaskCard key={task._id} task={task} />
          ))}
        </div>
      )}
    </>
  );
}

// ---- Tasks assigned to you in workspaces you don't lead -----------------------
function MySection({ tasks, label }) {
  const inProgress = tasks.filter((t) => t.status === "in-progress").length;
  const completed = tasks.filter((t) => t.status === "completed").length;

  return (
    <>
      {label && <p className="section-label">{label}</p>}

      <div className="stat-grid">
        <div className="stat">
          <div className="stat-value">{tasks.length}</div>
          <div className="stat-label">My tasks</div>
        </div>
        <div className="stat">
          <div className="stat-value">{inProgress}</div>
          <div className="stat-label">In progress</div>
        </div>
        <div className="stat">
          <div className="stat-value">{completed}</div>
          <div className="stat-label">Completed</div>
        </div>
      </div>

      <div className="section-header">
        <h2>My tasks</h2>
        <Link to="/tasks" className="link">View all tasks</Link>
      </div>
      <div className="task-list">
        {tasks.slice(0, 5).map((task) => (
          <TaskCard key={task._id} task={task} showAssignee={false} />
        ))}
      </div>
    </>
  );
}
