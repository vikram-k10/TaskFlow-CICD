// Shared helper used by every *authenticated* API call.
// It adds the JWT header, parses JSON, and turns failures into readable Errors.
const API_URL = import.meta.env.VITE_API_URL;

export async function request(path, { method = "GET", body } = {}) {
  const token = localStorage.getItem("token");

  let res;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new Error("Cannot reach the server. Check your connection and try again.");
  }

  let data = null;
  try {
    data = await res.json();
  } catch {
    // response had no JSON body
  }

  // Token missing or expired: clear the session and send the user to the login page
  if (res.status === 401) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
    throw new Error("Your session has expired. Please log in again.");
  }

  if (!res.ok) throw new Error(data?.error || "Something went wrong. Please try again.");
  return data;
}
