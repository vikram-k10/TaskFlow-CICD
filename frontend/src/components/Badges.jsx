import { STATUS_OPTIONS, labelFor } from "../utils/constants";

export function StatusBadge({ status }) {
  return <span className={`badge status-${status}`}>{labelFor(STATUS_OPTIONS, status)}</span>;
}
