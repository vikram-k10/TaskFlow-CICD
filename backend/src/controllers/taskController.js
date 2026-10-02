import mongoose from "mongoose";
import Task from "../models/Task.js";
import Workspace from "../models/Workspace.js";
import { isMember, isWorkspaceLead } from "../utils/access.js";
import { handleError } from "../utils/handleError.js";

// Who can do what (decided per workspace, never by an account-wide role):
//   Team lead (the workspace owner): view all tasks in it; create, edit, delete, assign
//   Member: sees only the tasks assigned to them, and can change only the status of those
// The main task list = every task in workspaces you own + every task assigned to you.
// Blocked requests get 403 (404 only when the task/workspace doesn't exist).

const asString = (value) => (typeof value === "string" ? value.trim() : "");

// Make user-typed search text safe to use inside a regular expression
const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Fields to load with each task so the UI can show names and work out permissions
const withDetails = (query) =>
  query.populate("workspace", "name owner").populate("assignee", "name");

const populateDetails = (task) =>
  task.populate([
    { path: "workspace", select: "name owner" },
    { path: "assignee", select: "name" },
  ]);

// Single-task responses say whether the current user leads the task's workspace,
// so the frontend never has to work that out itself.
const taskResponse = (task, lead) => ({ ...task.toObject(), isLead: lead });

// Loads a task the current user is allowed to see. On failure it sends the
// response itself (404 / 403) and returns null.
const loadTask = async (req, res) => {
  const { id } = req.params;
  const task = mongoose.isValidObjectId(id) ? await Task.findById(id) : null;
  const workspace = task ? await Workspace.findById(task.workspace) : null;
  if (!task || !workspace) {
    res.status(404).json({ error: "Task not found" });
    return null;
  }

  if (!isMember(workspace, req.userId)) {
    res.status(403).json({ error: "You are not a member of this workspace" });
    return null;
  }

  const lead = isWorkspaceLead(workspace, req.userId);
  if (!lead && String(task.assignee) !== req.userId) {
    res.status(403).json({ error: "This task is not assigned to you" });
    return null;
  }

  return { task, workspace, lead };
};

// GET /api/tasks?search=&status=&workspace=&assigned=me
export const getTasks = async (req, res) => {
  try {
    const search = asString(req.query.search);
    const status = asString(req.query.status);
    const workspace = asString(req.query.workspace);
    const assigned = asString(req.query.assigned);

    const filter = {};

    if (workspace) {
      // One workspace: its owner sees all of its tasks, a plain member only their own
      const found = mongoose.isValidObjectId(workspace)
        ? await Workspace.findById(workspace).select("owner members")
        : null;
      if (!found || !isMember(found, req.userId)) return res.json([]);

      filter.workspace = found._id;
      if (!isWorkspaceLead(found, req.userId)) filter.assignee = req.userId;
    } else {
      // Main list: everything in workspaces I own + everything assigned to me
      const mine = await Workspace.find({ members: req.userId }).select("_id owner");
      const owned = mine.filter((w) => isWorkspaceLead(w, req.userId)).map((w) => w._id);
      filter.$or = [
        { workspace: { $in: owned } },
        { workspace: { $in: mine.map((w) => w._id) }, assignee: req.userId },
      ];
    }

    if (search) filter.title = { $regex: escapeRegex(search), $options: "i" };
    if (status) filter.status = status;
    if (assigned === "me") filter.assignee = req.userId;

    const tasks = await withDetails(Task.find(filter).sort({ createdAt: -1 }));
    res.json(tasks);
  } catch (err) {
    handleError(res, err, "Could not load tasks");
  }
};

// GET /api/tasks/:id
export const getTask = async (req, res) => {
  try {
    const found = await loadTask(req, res);
    if (!found) return;

    await populateDetails(found.task);
    res.json(taskResponse(found.task, found.lead));
  } catch (err) {
    handleError(res, err, "Could not load task");
  }
};

// POST /api/tasks   (only the owner of the workspace the task is created in)
export const createTask = async (req, res) => {
  try {
    const { description, workspace: workspaceId, status, dueDate, assignee } = req.body;

    const title = asString(req.body.title);
    if (!title) {
      return res.status(400).json({ error: "Title is required" });
    }

    const workspace = mongoose.isValidObjectId(workspaceId)
      ? await Workspace.findById(workspaceId)
      : null;
    if (!workspace) {
      return res.status(400).json({ error: "Please choose a valid workspace" });
    }
    if (!isWorkspaceLead(workspace, req.userId)) {
      return res.status(403).json({ error: "Only the workspace's team lead can create tasks" });
    }
    if (assignee && !isMember(workspace, assignee)) {
      return res.status(400).json({ error: "The assignee must be a member of this workspace" });
    }

    const task = await Task.create({
      title,
      description,
      workspace: workspace._id,
      status,
      dueDate: dueDate || null,
      assignee: assignee || null,
      user: req.userId,
    });
    await populateDetails(task);

    res.status(201).json(taskResponse(task, true));
  } catch (err) {
    handleError(res, err, "Could not create task");
  }
};

// PUT /api/tasks/:id   (send only the fields you want to change)
export const updateTask = async (req, res) => {
  try {
    const found = await loadTask(req, res);
    if (!found) return;
    const { task, workspace, lead } = found;

    // A member (the assignee) may change the status and nothing else
    if (!lead && Object.keys(req.body).some((field) => field !== "status")) {
      return res.status(403).json({ error: "You can only update the status of your task" });
    }

    // Only copy the fields we allow (never trust the whole request body)
    ["title", "description", "status"].forEach((field) => {
      if (req.body[field] !== undefined) task[field] = req.body[field];
    });

    if (req.body.dueDate !== undefined) {
      task.dueDate = req.body.dueDate || null; // empty string clears the date
    }

    if (req.body.assignee !== undefined) {
      const assignee = req.body.assignee || null; // empty string = unassigned
      if (assignee && !isMember(workspace, assignee)) {
        return res.status(400).json({ error: "The assignee must be a member of this workspace" });
      }
      task.assignee = assignee;
    }

    await task.save();
    await populateDetails(task);

    res.json(taskResponse(task, lead));
  } catch (err) {
    handleError(res, err, "Could not update task");
  }
};

// DELETE /api/tasks/:id   (only the owner of the task's workspace)
export const deleteTask = async (req, res) => {
  try {
    const found = await loadTask(req, res);
    if (!found) return;

    if (!found.lead) {
      return res.status(403).json({ error: "Only the team lead can delete tasks" });
    }

    await found.task.deleteOne();
    res.json({ message: "Task deleted" });
  } catch (err) {
    handleError(res, err, "Could not delete task");
  }
};
