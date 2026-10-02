import { useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import useFetch from "../hooks/useFetch";
import { createTask, fetchTask, updateTask } from "../services/taskApi";
import { fetchWorkspaces } from "../services/workspaceApi";
import TaskForm from "../components/TaskForm";
import { EmptyState, ErrorMessage, Loading } from "../components/Feedback";
import { toDateInputValue } from "../utils/format";

// One page for both /tasks/new and /tasks/:id/edit. Only the owner of a workspace can use it.
export default function TaskFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const { data, loading, error, reload } = useFetch(async () => {
    const [workspaces, task] = await Promise.all([
      fetchWorkspaces(),
      isEdit ? fetchTask(id) : null,
    ]);
    return { workspaces, task };
  }, [id]);

  const cancelTo = isEdit ? `/tasks/${id}` : "/tasks";

  if (loading) return <Loading />;
  if (error) {
    return (
      <>
        <Link to={cancelTo} className="back-link">Back</Link>
        <ErrorMessage message={error} onRetry={reload} />
      </>
    );
  }

  const { workspaces, task } = data;
  const ledWorkspaces = workspaces.filter((w) => w.isLead);

  // Editing: the task's workspace must be one this user leads
  const taskWorkspace = isEdit ? ledWorkspaces.find((w) => w._id === task.workspace?._id) : null;
  if (isEdit && !taskWorkspace) {
    return (
      <>
        <Link to={cancelTo} className="back-link">Back</Link>
        <EmptyState
          title="Only the team lead can edit this task"
          text="Ask the workspace's team lead to make changes."
        />
      </>
    );
  }

  // Creating: needs at least one workspace the user leads
  if (!isEdit && ledWorkspaces.length === 0) {
    return (
      <>
        <h1>New task</h1>
        <EmptyState
          title="Create a workspace first"
          text="Tasks are created by a workspace's team lead. Create a workspace to become the lead of one."
          action={<Link to="/workspaces" className="btn btn-primary">Go to workspaces</Link>}
        />
      </>
    );
  }

  // Pre-select the workspace from the URL (?workspace=...) when the user leads it
  const requestedWorkspace = searchParams.get("workspace");
  const defaultWorkspace = ledWorkspaces.some((w) => w._id === requestedWorkspace)
    ? requestedWorkspace
    : ledWorkspaces.length === 1
    ? ledWorkspaces[0]._id
    : "";

  const initialValues = isEdit
    ? {
        title: task.title,
        description: task.description || "",
        workspace: task.workspace._id,
        assignee: task.assignee?._id || "",
        status: task.status,
        dueDate: toDateInputValue(task.dueDate),
      }
    : {
        title: "",
        description: "",
        workspace: defaultWorkspace,
        assignee: "",
        status: "todo",
        dueDate: "",
      };

  const handleSubmit = async (values) => {
    setSaving(true);
    setSaveError("");
    try {
      const saved = isEdit ? await updateTask(id, values) : await createTask(values);
      navigate(`/tasks/${saved._id}`);
    } catch (err) {
      setSaveError(err.message);
      setSaving(false);
    }
  };

  return (
    <>
      <Link to={cancelTo} className="back-link">Back</Link>
      <div className="page-header">
        <h1>{isEdit ? "Edit task" : "New task"}</h1>
      </div>
      <TaskForm
        initialValues={initialValues}
        workspaces={isEdit ? [taskWorkspace] : ledWorkspaces}
        workspaceLocked={isEdit}
        onSubmit={handleSubmit}
        submitting={saving}
        submitLabel={isEdit ? "Save changes" : "Create task"}
        cancelTo={cancelTo}
        error={saveError}
      />
    </>
  );
}
