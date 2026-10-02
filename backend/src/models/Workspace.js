import mongoose from "mongoose";

// A workspace is a named group of tasks (e.g. "Website Redesign").
// The user who creates it is the team lead (`owner`) and is also its first member.
const workspaceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Workspace name is required"],
      trim: true,
      maxlength: [60, "Workspace name must be 60 characters or fewer"],
    },
    description: {
      type: String,
      default: "",
      trim: true,
      maxlength: [300, "Description must be 300 characters or fewer"],
    },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

export default mongoose.model("Workspace", workspaceSchema);
