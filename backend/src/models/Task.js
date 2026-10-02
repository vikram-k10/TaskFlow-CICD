import mongoose from "mongoose";

export const TASK_STATUSES = ["todo", "in-progress", "completed"];

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [100, "Title must be 100 characters or fewer"],
    },
    description: {
      type: String,
      default: "",
      trim: true,
      maxlength: [1000, "Description must be 1000 characters or fewer"],
    },
    status: {
      type: String,
      enum: { values: TASK_STATUSES, message: "Status must be todo, in-progress or completed" },
      default: "todo",
    },
    dueDate: { type: Date, default: null },
    // The workspace member this task is assigned to (optional)
    assignee: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    // The user who created the task (the team lead)
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    workspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workspace",
      required: [true, "Workspace is required"],
    },
  },
  { timestamps: true }
);

export default mongoose.model("Task", taskSchema);
