import { useState } from "react";
import { Link } from "react-router-dom";
import useFetch from "../hooks/useFetch";
import { fetchTasks } from "../services/taskApi";
import { fetchWorkspaces } from "../services/workspaceApi";
import TaskCard from "../components/TaskCard";
import TaskFilters from "../components/TaskFilters";
import { EmptyState, ErrorMessage, Loading } from "../components/Feedback";

const NO_FILTERS = { search: "", status: "", workspace: "" };

// Every task in the workspaces you lead, plus every task assigned to you (the backend decides
// which tasks you may see). Search, workspace and status filters.
export default function Tasks() {
  const [filters, setFilters] = useState(NO_FILTERS);

  // Fetches again whenever a filter changes (useFetch ignores outdated responses)
  const { data, loading, error, reload } = useFetch(() => fetchTasks(filters), [filters]);

  // For the workspace filter, and to know whether this user can create tasks at all
  const { data: allWorkspaces } = useFetch(fetchWorkspaces, []);
  const workspaces = allWorkspaces || [];
  const canCreate = workspaces.some((w) => w.isLead);

  const tasks = data || [];
  const firstLoad = loading && data === null; // keep the old list on screen while refetching
  const filtersActive = Object.values(filters).some(Boolean);

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Tasks</h1>
          <p className="page-subtitle">
            Tasks in the workspaces you lead, and tasks assigned to you.
          </p>
        </div>
        {canCreate && <Link to="/tasks/new" className="btn btn-primary">New task</Link>}
      </div>

      <TaskFilters
        filters={filters}
        onChange={setFilters}
        onClear={() => setFilters(NO_FILTERS)}
        workspaces={workspaces}
      />

      {firstLoad && <Loading />}
      {error && <ErrorMessage message={error} onRetry={reload} />}

      {!firstLoad && !error && tasks.length === 0 && (
        filtersActive ? (
          <EmptyState
            title="No matching tasks"
            text="Try a different search or clear the filters."
            action={
              <button className="btn btn-secondary" onClick={() => setFilters(NO_FILTERS)}>
                Clear filters
              </button>
            }
          />
        ) : (
          <EmptyState
            title="No tasks yet"
            text="Tasks you create in your workspaces, or that a team lead assigns to you, will show up here."
            action={canCreate && <Link to="/tasks/new" className="btn btn-primary">Create a task</Link>}
          />
        )
      )}

      {!firstLoad && !error && tasks.length > 0 && (
        <>
          <p className="muted result-count">
            {tasks.length} {tasks.length === 1 ? "task" : "tasks"}
          </p>
          <div className="task-list">
            {tasks.map((task) => (
              <TaskCard key={task._id} task={task} />
            ))}
          </div>
        </>
      )}
    </>
  );
}
