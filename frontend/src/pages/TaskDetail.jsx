import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import useFetch from "../hooks/useFetch";
import { deleteTask, fetchTask, updateTask } from "../services/taskApi";
import { StatusBadge } from "../components/Badges";
import ConfirmDialog from "../components/ConfirmDialog";
import { ErrorMessage, Loading } from "../components/Feedback";
import { STATUS_OPTIONS } from "../utils/constants";
import { formatDueDate } from "../utils/format";

export default function TaskDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: task, setData: setTask, loading, error, reload } = useFetch(() => fetchTask(id), [id]);

  const [updating, setUpdating] = useState(false);
  const [actionError, setActionError] = useState("");
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const changeStatus = async (status) => {
    setUpdating(true);
    setActionError("");
    try {
      setTask(await updateTask(id, { status }));
    } catch (err) {
      setActionError(err.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteTask(id);
      navigate("/tasks");
    } catch (err) {
      setConfirmingDelete(false);
      setActionError(err.message);
      setDeleting(false);
    }
  };

  if (loading) return <Loading />;
  if (error) {
    return (
      <>
        <Link to="/tasks" className="back-link">Back to tasks</Link>
        <ErrorMessage message={error} onRetry={reload} />
      </>
    );
  }

  // Team lead: can do everything. Assignee: can change the status. Everyone else: read-only.
  const isLead = task.isLead; // decided by the backend (the workspace owner)
  const isAssignee = task.assignee?._id === user?.id;
  const canChangeStatus = isLead || isAssignee;

  return (
    <>
      <Link to="/tasks" className="back-link">Back to tasks</Link>

      <div className="page-header">
        <h1 className="task-detail-title">{task.title}</h1>
        {isLead && (
          <div className="header-actions">
            <Link to={`/tasks/${task._id}/edit`} className="btn btn-secondary">Edit</Link>
            <button className="btn btn-danger-outline" onClick={() => setConfirmingDelete(true)}>
              Delete
            </button>
          </div>
        )}
      </div>

      {actionError && <p className="form-error" role="alert">{actionError}</p>}

      <div className="panel">
        <dl className="details-grid">
          <div>
            <dt>Status</dt>
            <dd>
              <StatusBadge status={task.status} />
            </dd>
          </div>
          <div>
            <dt>Assigned to</dt>
            <dd>{task.assignee ? task.assignee.name : "Unassigned"}</dd>
          </div>
          <div>
            <dt>Due date</dt>
            <dd>{formatDueDate(task.dueDate)}</dd>
          </div>
          <div>
            <dt>Workspace</dt>
            <dd>
              {task.workspace ? (
                <Link to={`/workspaces/${task.workspace._id}`} className="link">
                  {task.workspace.name}
                </Link>
              ) : (
                "None"
              )}
            </dd>
          </div>
        </dl>

        <div className="detail-section">
          <h2>Description</h2>
          {task.description ? (
            <p className="description-text">{task.description}</p>
          ) : (
            <p className="muted">No description added.</p>
          )}
        </div>

        {canChangeStatus && (
          <div className="detail-section status-actions">
            <div className="field field-inline">
              <label htmlFor="status">Change status</label>
              <select
                id="status"
                value={task.status}
                onChange={(e) => changeStatus(e.target.value)}
                disabled={updating}
              >
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            {task.status !== "completed" && (
              <button
                className="btn btn-primary"
                onClick={() => changeStatus("completed")}
                disabled={updating}
              >
                {updating ? "Updating..." : "Mark as completed"}
              </button>
            )}
          </div>
        )}
      </div>

      {confirmingDelete && (
        <ConfirmDialog
          title="Delete this task?"
          message={`"${task.title}" will be permanently deleted. This can't be undone.`}
          confirmLabel="Delete task"
          busy={deleting}
          onConfirm={handleDelete}
          onCancel={() => setConfirmingDelete(false)}
        />
      )}
    </>
  );
}
