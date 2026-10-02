import { request } from "./api";

export const fetchWorkspaces = () => request("/workspaces");
export const fetchWorkspace = (id) => request(`/workspaces/${id}`);
export const createWorkspace = (workspace) =>
  request("/workspaces", { method: "POST", body: workspace });

// Workspace owner only
export const addMember = (workspaceId, email) =>
  request(`/workspaces/${workspaceId}/members`, { method: "POST", body: { email } });
export const removeMember = (workspaceId, userId) =>
  request(`/workspaces/${workspaceId}/members/${userId}`, { method: "DELETE" });
