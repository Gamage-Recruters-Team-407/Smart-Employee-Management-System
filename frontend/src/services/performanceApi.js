import api from "./api";

const performanceApi = {
  getAccess: () => api.get("/performance/access/me"),
  getAll: () => api.get("/performance"),
  getByEmployee: (employeeId) => api.get(`/performance/${employeeId}`),
  create: (payload) => api.post("/performance", payload),
  update: (id, payload) => api.put(`/performance/${id}`, payload),
  remove: (id) => api.delete(`/performance/${id}`),
  addFeedback: (id, payload) => api.put(`/performance/${id}/feedback`, payload)
};

export default performanceApi;
