import mongoose from "mongoose";
import Workspace from "../models/Workspace.js";
import Task from "../models/Task.js";
import User from "../models/User.js";
import { isOwner, isMember, isWorkspaceLead } from "../utils/access.js";
import { handleError } from "../utils/handleError.js";

const MEMBER_FIELDS = "name email";

// Every workspace response says whether the current user leads it (is its owner),
// so the frontend never has to work that out itself.
const workspaceResponse = (workspace, user, extra = {}) => ({
  ...workspace.toObject(),
  isLead: isWorkspaceLead(workspace, user._id),
  ...extra,
});

// Loads a workspace for the current user.
//   404 = it doesn't exist, 403 = it exists but the user isn't in it.
// On failure it sends the response itself and returns null.
const loadWorkspace = async (req, res) => {
  const { id } = req.params;
  const workspace = mongoose.isValidObjectId(id) ? await Workspace.findById(id) : null;
  if (!workspace) {
    res.status(404).json({ error: "Workspace not found" });
    return null;
  }
  if (!isMember(workspace, req.userId)) {
    res.status(403).json({ error: "You are not a member of this workspace" });
    return null;
  }
  return workspace;
};

// POST /api/workspaces   (any logged-in user; the creator becomes the owner = team lead of it)
export const createWorkspace = async (req, res) => {
  try {
    const name = typeof req.body.name === "string" ? req.body.name.trim() : "";
    if (!name) {
      return res.status(400).json({ error: "Workspace name is required" });
    }
    const description = typeof req.body.description === "string" ? req.body.description : "";

    const workspace = await Workspace.create({
      name,
      description,
      owner: req.userId,
      members: [req.userId],
    });
    await workspace.populate("members", MEMBER_FIELDS);
    res.status(201).json(workspaceResponse(workspace, req.user));
  } catch (err) {
    handleError(res, err, "Could not create workspace");
  }
};

// GET /api/workspaces  -> workspaces I lead or belong to.
// Each has taskCount / completedCount. The owner's counts cover the whole workspace;
// a member's counts cover only the tasks assigned to them.
export const getMyWorkspaces = async (req, res) => {
  try {
    const workspaces = await Workspace.find({ members: req.userId })
      .sort({ createdAt: -1 })
      .populate("members", MEMBER_FIELDS);

    const withCounts = await Promise.all(
      workspaces.map(async (workspace) => {
        const scope = { workspace: workspace._id };
        if (!isWorkspaceLead(workspace, req.userId)) scope.assignee = req.userId;

        const [taskCount, completedCount] = await Promise.all([
          Task.countDocuments(scope),
          Task.countDocuments({ ...scope, status: "completed" }),
        ]);
        return workspaceResponse(workspace, req.user, { taskCount, completedCount });
      })
    );

    res.json(withCounts);
  } catch (err) {
    handleError(res, err, "Could not load workspaces");
  }
};

// GET /api/workspaces/:id
export const getWorkspace = async (req, res) => {
  try {
    const workspace = await loadWorkspace(req, res);
    if (!workspace) return;

    await workspace.populate("members", MEMBER_FIELDS);
    res.json(workspaceResponse(workspace, req.user));
  } catch (err) {
    handleError(res, err, "Could not load workspace");
  }
};

// POST /api/workspaces/:id/members   body: { email }   (workspace's team lead only)
export const addMember = async (req, res) => {
  try {
    const workspace = await loadWorkspace(req, res);
    if (!workspace) return;
    if (!isWorkspaceLead(workspace, req.userId)) {
      return res.status(403).json({ error: "Only the team lead can add members" });
    }

    const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
    if (!email) return res.status(400).json({ error: "Enter the member's email" });

    const userToAdd = await User.findOne({ email });
    if (!userToAdd) {
      return res.status(404).json({ error: "No user found with that email. They need to sign up first." });
    }
    if (isMember(workspace, userToAdd._id)) {
      return res.status(400).json({ error: "That user is already a member" });
    }

    workspace.members.push(userToAdd._id);
    await workspace.save();
    await workspace.populate("members", MEMBER_FIELDS);
    res.json(workspaceResponse(workspace, req.user));
  } catch (err) {
    handleError(res, err, "Could not add member");
  }
};

// DELETE /api/workspaces/:id/members/:userId   (workspace's team lead only)
// This only removes the person from the workspace. Their account is untouched and
// their tasks are kept (they just become unassigned).
export const removeMember = async (req, res) => {
  try {
    const workspace = await loadWorkspace(req, res);
    if (!workspace) return;
    if (!isWorkspaceLead(workspace, req.userId)) {
      return res.status(403).json({ error: "Only the team lead can remove members" });
    }

    const { userId } = req.params;
    if (isOwner(workspace, userId)) {
      return res.status(400).json({ error: "The team lead cannot be removed" });
    }
    if (!isMember(workspace, userId)) {
      return res.status(404).json({ error: "That user is not a member" });
    }

    workspace.members = workspace.members.filter((id) => String(id) !== String(userId));
    await workspace.save();

    // Their tasks stay in the workspace but become unassigned
    await Task.updateMany({ workspace: workspace._id, assignee: userId }, { assignee: null });

    await workspace.populate("members", MEMBER_FIELDS);
    res.json(workspaceResponse(workspace, req.user));
  } catch (err) {
    handleError(res, err, "Could not remove member");
  }
};
