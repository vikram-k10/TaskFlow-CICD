import { useState } from "react";
import { addMember, removeMember } from "../services/workspaceApi";
import ConfirmDialog from "./ConfirmDialog";

// Lists a workspace's members. The workspace owner is its team lead and can add (by email) and remove members.
// `onChange(updatedWorkspace, removedUserId)` lets the page update itself.
export default function MembersPanel({ workspace, isLead, onChange }) {
  const [email, setEmail] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");
  const [memberToRemove, setMemberToRemove] = useState(null);
  const [removing, setRemoving] = useState(false);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!email.trim()) return setError("Enter the member's email");

    setAdding(true);
    setError("");
    try {
      const updated = await addMember(workspace._id, email.trim());
      onChange(updated, null);
      setEmail("");
    } catch (err) {
      setError(err.message);
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async () => {
    setRemoving(true);
    try {
      const updated = await removeMember(workspace._id, memberToRemove._id);
      onChange(updated, memberToRemove._id);
      setMemberToRemove(null);
    } catch (err) {
      setMemberToRemove(null);
      setError(err.message);
    } finally {
      setRemoving(false);
    }
  };

  return (
    <div className="panel members-panel">
      <h2>Members</h2>

      <ul className="member-list">
        {workspace.members.map((member) => {
          const isOwner = member._id === workspace.owner;
          // Inside a workspace, the owner is the team lead and everyone else is a member.
          return (
            <li key={member._id} className="member-row">
              <div>
                <span className="member-name">{member.name}</span>
                <span className="role-tag">{isOwner ? "Team lead" : "Member"}</span>
                <div className="member-email">{member.email}</div>
              </div>
              {isLead && !isOwner && (
                <button className="btn btn-danger-outline" onClick={() => setMemberToRemove(member)}>
                  Remove
                </button>
              )}
            </li>
          );
        })}
      </ul>

      {isLead && (
        <form className="add-member" onSubmit={handleAdd} noValidate>
          <input
            type="email"
            placeholder="Member's email address"
            aria-label="Member's email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError("");
            }}
          />
          <button type="submit" className="btn btn-secondary" disabled={adding}>
            {adding ? "Adding..." : "Add member"}
          </button>
        </form>
      )}

      {error && <p className="form-error members-error" role="alert">{error}</p>}

      {memberToRemove && (
        <ConfirmDialog
          title={`Remove ${memberToRemove.name}?`}
          message="They will lose access to this workspace. Tasks assigned to them become unassigned."
          confirmLabel="Remove member"
          busy={removing}
          onConfirm={handleRemove}
          onCancel={() => setMemberToRemove(null)}
        />
      )}
    </div>
  );
}
