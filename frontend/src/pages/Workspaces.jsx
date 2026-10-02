import { useState } from "react";
import { Link } from "react-router-dom";
import useFetch from "../hooks/useFetch";
import { createWorkspace, fetchWorkspaces } from "../services/workspaceApi";
import WorkspaceForm from "../components/WorkspaceForm";
import WorkspaceProgress from "../components/WorkspaceProgress";
import { EmptyState, ErrorMessage, Loading } from "../components/Feedback";

export default function Workspaces() {
  const { data, setData, loading, error, reload } = useFetch(fetchWorkspaces, []);
  const [showForm, setShowForm] = useState(false);

  const workspaces = data || [];

  const handleCreate = async (values) => {
    const created = await createWorkspace(values);
    // Show it at the top of the list straight away (a new workspace has 0 tasks)
    setData([{ ...created, taskCount: 0, completedCount: 0 }, ...workspaces]);
    setShowForm(false);
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Workspaces</h1>
          <p className="page-subtitle">
            Workspaces you lead or belong to. Creating one makes you its team lead.
          </p>
        </div>
        {!showForm && (
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            New workspace
          </button>
        )}
      </div>

      {showForm && (
        <WorkspaceForm onCreate={handleCreate} onCancel={() => setShowForm(false)} />
      )}

      {loading && <Loading />}
      {error && <ErrorMessage message={error} onRetry={reload} />}

      {!loading && !error && workspaces.length === 0 && !showForm && (
        <EmptyState
          title="No workspaces yet"
          text="A workspace holds the tasks for one project. Create one to get started, or ask a team lead to add you to theirs."
          action={
            <button className="btn btn-primary" onClick={() => setShowForm(true)}>
              Create a workspace
            </button>
          }
        />
      )}

      {!loading && !error && workspaces.length > 0 && (
        <div className="workspace-grid">
          {workspaces.map((workspace) => (
            <Link key={workspace._id} to={`/workspaces/${workspace._id}`} className="workspace-card">
              <h2>{workspace.name}</h2>
              <div>
                <span className="role-tag">
                  {workspace.isLead ? "Team lead" : "Member"}
                </span>
              </div>
              <p className="workspace-description">
                {workspace.description || "No description"}
              </p>
              <WorkspaceProgress completed={workspace.completedCount} total={workspace.taskCount} />
              <div className="workspace-footer">
                <span>{workspace.taskCount} {workspace.taskCount === 1 ? "task" : "tasks"}</span>
                <span>{workspace.members.length-1} {workspace.members.length-1 === 1 ? "member" : "members"}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
