import { useState } from "react";
import { Link } from "react-router-dom";
import { STATUS_OPTIONS } from "../utils/constants";

// Used for both "New task" and "Edit task" (team lead only).
// `workspaces` are the ones the user leads; each has a populated `members` list,
// which feeds the "Assigned to" dropdown. `workspaceLocked` freezes the workspace when editing.
export default function TaskForm({
  initialValues,
  workspaces,
  workspaceLocked,
  onSubmit,
  submitting,
  submitLabel,
  cancelTo,
  error,
}) {
  const [values, setValues] = useState(initialValues);
  const [localError, setLocalError] = useState("");

  const selectedWorkspace = workspaces.find((w) => w._id === values.workspace);
  const members = selectedWorkspace ? selectedWorkspace.members : [];

  const update = (name) => (e) => {
    setValues({ ...values, [name]: e.target.value });
    setLocalError(""); // clear the old validation message once the user edits
  };

  // Members differ per workspace, so picking another workspace clears the assignee
  const changeWorkspace = (e) => {
    setValues({ ...values, workspace: e.target.value, assignee: "" });
    setLocalError("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!values.title.trim()) return setLocalError("Title is required");
    if (!values.workspace) return setLocalError("Please choose a workspace");

    setLocalError("");
    onSubmit({
      ...values,
      title: values.title.trim(),
      description: values.description.trim(),
    });
  };

  const shownError = localError || error;

  return (
    <form className="panel form" onSubmit={handleSubmit} noValidate>
      <div className="field">
        <label htmlFor="title">Title</label>
        <input
          id="title"
          type="text"
          value={values.title}
          onChange={update("title")}
          maxLength={100}
          placeholder="e.g. Prepare release notes"
          autoFocus
        />
      </div>

      <div className="field">
        <label htmlFor="description">Description</label>
        <textarea
          id="description"
          rows={4}
          value={values.description}
          onChange={update("description")}
          maxLength={1000}
          placeholder="Add details, links or acceptance criteria (optional)"
        />
      </div>

      <div className="form-grid">
        <div className="field">
          <label htmlFor="workspace">Workspace</label>
          <select
            id="workspace"
            value={values.workspace}
            onChange={changeWorkspace}
            disabled={workspaceLocked}
          >
            <option value="">Select a workspace</option>
            {workspaces.map((w) => (
              <option key={w._id} value={w._id}>{w.name}</option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="assignee">Assigned to</label>
          <select
            id="assignee"
            value={values.assignee}
            onChange={update("assignee")}
            disabled={!values.workspace}
          >
            <option value="">Unassigned</option>
            {members.map((m) => (
              <option key={m._id} value={m._id}>{m.name}</option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="status">Status</label>
          <select id="status" value={values.status} onChange={update("status")}>
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="dueDate">Due date</label>
          <input id="dueDate" type="date" value={values.dueDate} onChange={update("dueDate")} />
        </div>
      </div>

      {shownError && <p className="form-error" role="alert">{shownError}</p>}

      <div className="form-actions">
        <Link to={cancelTo} className="btn btn-secondary">Cancel</Link>
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? "Saving..." : submitLabel}
        </button>
      </div>
    </form>
  );
}
