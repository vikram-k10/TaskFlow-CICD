import { Link, useParams } from "react-router-dom";
import useFetch from "../hooks/useFetch";
import { fetchWorkspace } from "../services/workspaceApi";
import { fetchTasks } from "../services/taskApi";
import MembersPanel from "../components/MembersPanel";
import WorkspaceProgress from "../components/WorkspaceProgress";
import TaskCard from "../components/TaskCard";
import { EmptyState, ErrorMessage, Loading } from "../components/Feedback";

export default function WorkspaceDetail() {
  const { id } = useParams();

  const { data, setData, loading, error, reload } = useFetch(async () => {
    const [workspace, tasks] = await Promise.all([fetchWorkspace(id), fetchTasks({ workspace: id })]);
    return { workspace, tasks };
  }, [id]);

  if (loading) return <Loading />;
  if (error) {
    return (
      <>
        <Link to="/workspaces" className="back-link">Back to workspaces</Link>
        <ErrorMessage message={error} onRetry={reload} />
      </>
    );
  }

  const { workspace, tasks } = data;
  const isLead = workspace.isLead; // decided by the backend (the workspace owner)
  const countByStatus = (status) => tasks.filter((t) => t.status === status).length;
  const completed = countByStatus("completed");

  // Called by MembersPanel after adding/removing a member
  const handleMembersChanged = (updatedWorkspace, removedUserId) => {
    // Removing a member unassigns their tasks on the server, so mirror that here
    const updatedTasks = removedUserId
      ? tasks.map((t) => (t.assignee?._id === removedUserId ? { ...t, assignee: null } : t))
      : tasks;
    setData({ workspace: updatedWorkspace, tasks: updatedTasks });
  };

  return (
    <>
      <Link to="/workspaces" className="back-link">Back to workspaces</Link>

      <div className="page-header">
        <div>
          <h1>{workspace.name}</h1>
          <p className="page-subtitle">{workspace.description || "No description"}</p>
          <p className="muted">Workspace role: {isLead ? "Team lead" : "Member"}</p>
        </div>
        {isLead && (
          <Link to={`/tasks/new?workspace=${workspace._id}`} className="btn btn-primary">
            New task
          </Link>
        )}
      </div>

      <div className="panel">
        {/* Team lead: the whole workspace. Member: only the tasks assigned to them. */}
        <h2>{isLead ? "Workspace progress" : "My progress"}</h2>
        {isLead && (
          <div className="stat-grid" style={{ marginBottom: 16 }}>
            <div className="stat">
              <div className="stat-value">{tasks.length}</div>
              <div className="stat-label">Total</div>
            </div>
            <div className="stat">
              <div className="stat-value">{countByStatus("todo")}</div>
              <div className="stat-label">To do</div>
            </div>
            <div className="stat">
              <div className="stat-value">{countByStatus("in-progress")}</div>
              <div className="stat-label">In progress</div>
            </div>
            <div className="stat">
              <div className="stat-value">{completed}</div>
              <div className="stat-label">Completed</div>
            </div>
          </div>
        )}
        <WorkspaceProgress completed={completed} total={tasks.length} />
      </div>

      <MembersPanel workspace={workspace} isLead={isLead} onChange={handleMembersChanged} />

      <div className="section-header">
        <h2>Tasks</h2>
        <span className="muted">
          {isLead ? `${tasks.length} in this workspace` : `${tasks.length} assigned to you`}
        </span>
      </div>

      {tasks.length === 0 ? (
        <EmptyState
          title={isLead ? "No tasks in this workspace" : "No tasks assigned to you here"}
          text={isLead ? "Add the first task and assign it to a member." : "Tasks the team lead assigns to you will appear here."}
          action={
            isLead && (
              <Link to={`/tasks/new?workspace=${workspace._id}`} className="btn btn-primary">
                Create a task
              </Link>
            )
          }
        />
      ) : (
        <div className="task-list">
          {tasks.map((task) => (
            <TaskCard key={task._id} task={task} showWorkspace={false} showAssignee={isLead} />
          ))}
        </div>
      )}
    </>
  );
}
