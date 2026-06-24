import React, { useState, useEffect, useCallback } from "react";
import API from "../services/api";
import { fetchEmployees as fetchEmployeesList } from "../services/employeeService";
import TaskBoard from "../components/TaskBoard";
import { useAuth } from "../context/AuthContext";
import MyTasks from "./MyTasks";
import Issues from "./Issues";
import DailyReports from "../components/DailyReports";

const TASK_STATUSES = ["To Do", "In Progress", "Review", "Completed"];

const initialFormData = {
  title: "",
  description: "",
  assignedTo: "",
  dueDate: "",
  status: "To Do",
};

const validateTaskForm = (data, employees, { isEdit = false } = {}) => {
  const errors = {};
  const title = data.title.trim();

  if (!title) {
    errors.title = "Title is required";
  } else if (title.length < 3) {
    errors.title = "Title must be at least 3 characters";
  } else if (title.length > 100) {
    errors.title = "Title must not exceed 100 characters";
  }

  const description = data.description.trim();
  if (description.length > 500) {
    errors.description = "Description must not exceed 500 characters";
  }

  if (!data.assignedTo) {
    errors.assignedTo = "Please select an employee to assign";
  } else if (!employees.some((emp) => emp._id === data.assignedTo)) {
    errors.assignedTo = "Please select a valid employee";
  }

  if (!data.dueDate) {
    errors.dueDate = "Due date is required";
  } else {
    const due = new Date(data.dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    due.setHours(0, 0, 0, 0);
    if (!isEdit && due < today) {
      errors.dueDate = "Due date cannot be in the past";
    }
  }

  if (!TASK_STATUSES.includes(data.status)) {
    errors.status = "Please select a valid status";
  }

  return errors;
};

const Tasks = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [activeTab, setActiveTab] = useState("manage"); // 'my' | 'manage'

  const fetchTasks = useCallback(async () => {
    try {
      const { data } = await API.get("/tasks");
      setTasks(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load tasks:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchEmployees = useCallback(async () => {
    try {
      const result = await fetchEmployeesList({
        page: 1,
        limit: 500,
        sortField: "firstName",
        sortDir: "asc",
      });
      const list = Array.isArray(result?.data) ? result.data : [];
      const assignable = list.filter(
        (emp) => emp.status !== "Terminated" && emp.status !== "Inactive"
      );
      setEmployees(assignable);
    } catch (err) {
      console.error("Failed to load employees:", err);
      setEmployees([]);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
    fetchEmployees();
  }, [fetchTasks, fetchEmployees]);

  useEffect(() => {
    if (isModalOpen) fetchEmployees();
  }, [isModalOpen, fetchEmployees]);

  const resetForm = () => {
    setFormData(initialFormData);
    setErrors({});
    setTouched({});
  };

  const openModal = () => {
    resetForm();
    setModalMode("create");
    setEditingTaskId(null);
    setIsModalOpen(true);
  };

  const openEditModal = (task) => {
    setFormData({
      title: task.title || "",
      description: task.description || "",
      assignedTo: task.assignedTo?._id || task.assignedTo || "",
      dueDate: task.dueDate
        ? new Date(task.dueDate).toISOString().split("T")[0]
        : "",
      status: task.status || "To Do",
    });
    setErrors({});
    setTouched({});
    setModalMode("edit");
    setEditingTaskId(task._id);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setModalMode("create");
    setEditingTaskId(null);
    resetForm();
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const next = { ...prev, [name]: value };
      if (touched[name]) {
        setErrors((prevErrors) => {
          const nextErrors = { ...prevErrors };
          const fieldErrors = validateTaskForm(next, employees, {
            isEdit: modalMode === "edit",
          });
          if (fieldErrors[name]) nextErrors[name] = fieldErrors[name];
          else delete nextErrors[name];
          return nextErrors;
        });
      }
      return next;
    });
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    const fieldErrors = validateTaskForm(formData, employees, {
      isEdit: modalMode === "edit",
    });
    setErrors((prev) => {
      const next = { ...prev };
      if (fieldErrors[name]) next[name] = fieldErrors[name];
      else delete next[name];
      return next;
    });
  };

  const handleSubmitTask = async (e) => {
    e.preventDefault();
    const isEdit = modalMode === "edit";
    const validationErrors = validateTaskForm(formData, employees, { isEdit });
    setErrors(validationErrors);
    setTouched({
      title: true,
      description: true,
      assignedTo: true,
      dueDate: true,
      status: true,
    });

    if (Object.keys(validationErrors).length > 0) return;

    setSubmitting(true);
    try {
      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        assignedTo: formData.assignedTo,
        dueDate: formData.dueDate,
        status: formData.status,
      };

      if (isEdit) {
        const { data: updated } = await API.put(`/tasks/${editingTaskId}`, payload);
        setTasks((prev) =>
          prev.map((t) => (t._id === editingTaskId ? updated : t))
        );
      } else {
        const { data: created } = await API.post("/tasks", payload);
        setTasks((prev) => [created, ...prev]);
      }
      closeModal();
    } catch (err) {
      if (err.errors) {
        setErrors(err.errors);
      } else {
        alert(
          err.message ||
            (isEdit ? "Failed to update task" : "Failed to create task")
        );
      }
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const fieldError = (name) =>
    touched[name] && errors[name] ? (
      <p className="text-red-500 text-sm mt-1">{errors[name]}</p>
    ) : null;

  const inputClass = (name) =>
    `w-full border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 ${
      touched[name] && errors[name]
        ? "border-red-400 focus:ring-red-400"
        : "border-gray-300 focus:ring-indigo-500"
    }`;

  const todayStr = new Date().toISOString().split("T")[0];

  const handleAddComment = async (taskId, text) => {
    const { data: updated } = await API.post(`/tasks/${taskId}/comments`, {
      text,
      author: user?.name || "HR/Manager",
    });
    setTasks((prev) => prev.map((t) => (t._id === taskId ? updated : t)));
  };

  const handleDelete = async (taskId) => {
    if (!confirm("Delete this task?")) return;
    try {
      await API.delete(`/tasks/${taskId}`);
      setTasks((prev) => prev.filter((t) => t._id !== taskId));
    } catch (err) {
      console.error(err);
      alert("Failed to delete task");
    }
  };

  const stats = {
    total: tasks.length,
    todo: tasks.filter((t) => t.status === "To Do").length,
    inProgress: tasks.filter((t) => t.status === "In Progress").length,
    review: tasks.filter((t) => t.status === "Review").length,
    completed: tasks.filter((t) => t.status === "Completed").length,
  };

  return (
    <div className="p-8 max-w-[1600px] mx-auto">
      <div className="flex gap-2 mb-6 bg-white rounded-2xl shadow p-2 w-fit">
        <button
          onClick={() => setActiveTab("my")}
          className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition ${
            activeTab === "my" ? "bg-indigo-600 text-white" : "text-gray-600 hover:bg-gray-50"
          }`}
        >
          My Tasks
        </button>
        <button
          onClick={() => setActiveTab("manage")}
          className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition ${
            activeTab === "manage" ? "bg-indigo-600 text-white" : "text-gray-600 hover:bg-gray-50"
          }`}
        >
          Task Management
        </button>
        <button
          onClick={() => setActiveTab("issues")}
          className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition ${
            activeTab === "issues" ? "bg-indigo-600 text-white" : "text-gray-600 hover:bg-gray-50"
          }`}
        >
          Issues
        </button>
        {(user?.role === "Admin" || user?.role === "HR") && (
          <button
            onClick={() => setActiveTab("reports")}
            className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition ${
              activeTab === "reports" ? "bg-indigo-600 text-white" : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            Daily Reports
          </button>
        )}
      </div>

      {activeTab === "my" && <MyTasks />}

      {activeTab === "manage" && (
        <>
      <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Task Management</h1>
          <p className="text-gray-500 mt-1 max-w-2xl">
            Create and assign tasks to employees and add comments. Employees update progress and status from the My Tasks page.
          </p>
        </div>
        <button
          onClick={openModal}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-semibold transition"
        >
          + Assign Task
        </button>
      </div>
      <div className="mb-4 flex flex-wrap gap-2 text-xs text-gray-500">
        <span className="font-medium text-gray-700">Workflow:</span>
        {TASK_STATUSES.map((s, i) => (
          <span key={s} className="flex items-center gap-2">
            {i > 0 && <span>→</span>}
            <span className="px-2 py-0.5 bg-gray-100 rounded-md">{s}</span>
          </span>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        {[
          { label: "Total Tasks", value: stats.total, color: "bg-indigo-50 text-indigo-700" },
          { label: "To Do", value: stats.todo, color: "bg-slate-50 text-slate-700" },
          { label: "In Progress", value: stats.inProgress, color: "bg-blue-50 text-blue-700" },
          { label: "Review", value: stats.review, color: "bg-amber-50 text-amber-700" },
          { label: "Completed", value: stats.completed, color: "bg-green-50 text-green-700" },
        ].map((s) => (
          <div key={s.label} className={`rounded-xl p-4 ${s.color}`}>
            <p className="text-sm font-medium opacity-80">{s.label}</p>
            <p className="text-2xl font-bold">{s.value}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <p className="text-center text-gray-500 py-12">Loading tasks...</p>
      ) : (
        <TaskBoard
          tasks={tasks}
          onEdit={openEditModal}
          onAddComment={handleAddComment}
          onDelete={handleDelete}
        />
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-auto">
            <div className="p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold">
                  {modalMode === "edit" ? "Edit Task" : "Assign New Task"}
                </h2>
                <button
                  onClick={closeModal}
                  className="text-gray-500 hover:text-gray-700 text-3xl leading-none"
                >
                  ×
                </button>
              </div>

              {Object.keys(errors).length > 0 && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                  Please fix the errors below before submitting.
                </div>
              )}

              <form onSubmit={handleSubmitTask} className="space-y-4" noValidate>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    maxLength={100}
                    className={inputClass("title")}
                    placeholder="Task title (min 3 characters)"
                  />
                  {fieldError("title")}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    rows={3}
                    maxLength={500}
                    className={`${inputClass("description")} resize-y`}
                    placeholder="Task details (max 500 characters)"
                  />
                  <p className="text-xs text-gray-400 mt-1 text-right">
                    {formData.description.length}/500
                  </p>
                  {fieldError("description")}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Assign To <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="assignedTo"
                    value={formData.assignedTo}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    disabled={employees.length === 0}
                    className={inputClass("assignedTo")}
                  >
                    <option value="">
                      {employees.length === 0
                        ? "No employees available"
                        : "Select employee"}
                    </option>
                    {employees.map((emp) => (
                      <option key={emp._id} value={emp._id}>
                        {emp.firstName} {emp.lastName}
                        {emp.employeeId ? ` (${emp.employeeId})` : ""}
                        {emp.department ? ` — ${emp.department}` : ""}
                      </option>
                    ))}
                  </select>
                  {employees.length === 0 && (
                    <p className="text-amber-600 text-sm mt-1">
                      Add employees from the Employees page first.
                    </p>
                  )}
                  {fieldError("assignedTo")}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Due Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      name="dueDate"
                      value={formData.dueDate}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      min={modalMode === "edit" ? undefined : todayStr}
                      className={inputClass("dueDate")}
                    />
                    {fieldError("dueDate")}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Initial Status <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={inputClass("status")}
                    >
                      {TASK_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                    {fieldError("status")}
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 py-3 border border-gray-300 rounded-xl font-medium hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl"
                  >
                    {submitting
                      ? modalMode === "edit"
                        ? "Saving..."
                        : "Creating..."
                      : modalMode === "edit"
                        ? "Save Changes"
                        : "Create Task"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
        </>
      )}
      {activeTab === "issues" && <Issues />}
      {activeTab === "reports" && (user?.role === "Admin" || user?.role === "HR") && <DailyReports />}
    </div>
  );
};

export default Tasks;