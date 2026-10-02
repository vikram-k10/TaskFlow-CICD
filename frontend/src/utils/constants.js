// Single source of truth for task statuses.
// `value` is what the backend stores, `label` is what the user sees.
export const STATUS_OPTIONS = [
  { value: "todo", label: "To do" },
  { value: "in-progress", label: "In progress" },
  { value: "completed", label: "Completed" },
];

export const labelFor = (options, value) =>
  options.find((option) => option.value === value)?.label ?? value;
