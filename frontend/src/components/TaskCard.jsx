import { Link } from "react-router-dom";
import { StatusBadge } from "./Badges";
import { formatDueDate } from "../utils/format";

// One row in a task list. The whole row links to the task's detail page.
export default function TaskCard({ task, showWorkspace = true, showAssignee = true }) {
  return (
    <Link to={`/tasks/${task._id}`} className="task-card">
      <div className="task-main">
        <div className="task-title">{task.title}</div>
        <div className="task-meta">
          {showWorkspace && task.workspace && <span>{task.workspace.name}</span>}
          {showAssignee && (
            <span>{task.assignee ? `Assigned to ${task.assignee.name}` : "Unassigned"}</span>
          )}
          <span>{task.dueDate ? `Due ${formatDueDate(task.dueDate)}` : "No due date"}</span>
        </div>
      </div>
      <div className="task-badges">
        <StatusBadge status={task.status} />
      </div>
    </Link>
  );
}
