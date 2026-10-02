import { useState } from "react";

// Inline form on the Workspaces page. `onCreate` does the API call (and can throw).
export default function WorkspaceForm({ onCreate, onCancel }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return setError("Workspace name is required");

    setSaving(true);
    setError("");
    try {
      await onCreate({ name: name.trim(), description: description.trim() });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="panel form" onSubmit={handleSubmit} noValidate>
      <div className="field">
        <label htmlFor="ws-name">Workspace name</label>
        <input
          id="ws-name"
          type="text"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setError("");
          }}
          maxLength={60}
          placeholder="e.g. Website Redesign"
          autoFocus
        />
      </div>
      <div className="field">
        <label htmlFor="ws-description">Description</label>
        <textarea
          id="ws-description"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={300}
          placeholder="What is this workspace for? (optional)"
        />
      </div>

      {error && <p className="form-error" role="alert">{error}</p>}

      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? "Creating..." : "Create workspace"}
        </button>
      </div>
    </form>
  );
}
