// The whole permission model in a few small functions.
// There is no account-wide role. Your role is decided per workspace:
//   Team lead = the user who owns (created) the workspace  -> workspace.owner
//   Member    = anyone else in workspace.members
// Being the team lead of one workspace gives no power over any other workspace.
export const isOwner = (workspace, userId) => String(workspace.owner) === String(userId);

export const isMember = (workspace, userId) =>
  workspace.members.some((memberId) => String(memberId) === String(userId));

export const isWorkspaceLead = (workspace, userId) => isOwner(workspace, userId);
