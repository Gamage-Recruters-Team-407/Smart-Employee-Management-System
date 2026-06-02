const baseURL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const getAuthHeaders = () => {
  const headers = {};

  // FUTURE JWT: const token = localStorage.getItem("token");
  // if (token) headers.Authorization = `Bearer ${token}`;

  const mockEmployeeId = localStorage.getItem("sems_mock_employee_id");
  if (mockEmployeeId) {
    headers["X-Mock-Employee-Id"] = mockEmployeeId;
  }

  return headers;
};

async function request(path, options = {}) {
  let res;
  try {
    res = await fetch(`${baseURL}${path}`, {
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
        ...options.headers,
      },
      ...options,
    });
  } catch {
    throw new Error(
      "Cannot reach the backend. Start it with: cd backend && npm run dev"
    );
  }

  let data;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok) {
    const err = new Error(data?.message || `Request failed (${res.status})`);
    if (data?.errors) err.errors = data.errors;
    throw err;
  }

  return data;
}

const API = {
  get: (path) => request(path),
  post: (path, data) =>
    request(path, { method: "POST", body: JSON.stringify(data) }),
  put: (path, data) =>
    request(path, { method: "PUT", body: JSON.stringify(data) }),
  patch: (path, data) =>
    request(path, { method: "PATCH", body: JSON.stringify(data) }),
  delete: (path) => request(path, { method: "DELETE" }),
};

export default API;
