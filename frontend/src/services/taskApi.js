import { request } from "./api";

// { search: "bug", status: "todo" } -> "?search=bug&status=todo" (empty values are skipped)
const toQueryString = (filters) => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });
  const query = params.toString();
  return query ? `?${query}` : "";
};

export const fetchTasks = (filters = {}) => request(`/tasks${toQueryString(filters)}`);
export const fetchTask = (id) => request(`/tasks/${id}`);
export const createTask = (task) => request("/tasks", { method: "POST", body: task });
export const updateTask = (id, changes) => request(`/tasks/${id}`, { method: "PUT", body: changes });
export const deleteTask = (id) => request(`/tasks/${id}`, { method: "DELETE" });
