import { STATUS_OPTIONS } from "../utils/constants";

// Search, workspace and status filters. The parent owns the state.
export default function TaskFilters({ filters, onChange, onClear, workspaces = [] }) {
  const hasFilters = filters.search || filters.status || filters.workspace;
  const update = (name) => (e) => onChange({ ...filters, [name]: e.target.value });

  return (
    <div className="filters">
      <input
        type="search"
        placeholder="Search by task title"
        aria-label="Search tasks by title"
        value={filters.search}
        onChange={update("search")}
      />
      {workspaces.length > 0 && (
        <select aria-label="Filter by workspace" value={filters.workspace} onChange={update("workspace")}>
          <option value="">All workspaces</option>
          {workspaces.map((w) => (
            <option key={w._id} value={w._id}>{w.name}</option>
          ))}
        </select>
      )}
      <select aria-label="Filter by status" value={filters.status} onChange={update("status")}>
        <option value="">All statuses</option>
        {STATUS_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      {hasFilters && (
        <button className="btn btn-ghost" onClick={onClear}>
          Clear filters
        </button>
      )}
    </div>
  );
}
