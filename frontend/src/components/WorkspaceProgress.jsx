// "3 of 5 completed" + a thin bar. Safe when there are no tasks (no divide-by-zero).
export default function WorkspaceProgress({ completed = 0, total = 0 }) {
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
  return (
    <div className="progress" title={`${percent}% completed`}>
      <div className="progress-text">
        {total === 0 ? "No tasks yet" : `${completed} of ${total} completed (${percent}%)`}
      </div>
      <div className="progress-track" aria-hidden="true">
        <div className="progress-fill" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
