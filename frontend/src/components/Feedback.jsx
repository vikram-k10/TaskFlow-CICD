// Small building blocks for the three "non-happy" states every page needs.

export function Loading({ text = "Loading..." }) {
  return (
    <div className="state-box" role="status">
      <span className="spinner" aria-hidden="true" />
      {text}
    </div>
  );
}

export function ErrorMessage({ message, onRetry }) {
  return (
    <div className="state-box state-error" role="alert">
      <p>{message}</p>
      {onRetry && (
        <button className="btn btn-secondary" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}

// `action` is an optional button/link shown under the text
export function EmptyState({ title, text, action }) {
  return (
    <div className="state-box empty-state">
      <h2>{title}</h2>
      {text && <p>{text}</p>}
      {action}
    </div>
  );
}
