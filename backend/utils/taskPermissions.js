/** Task workflow: To Do → In Progress → Review → Completed */
export const TASK_STATUSES = ["To Do", "In Progress", "Review", "Completed"];

const normalize = (value) => String(value || "").trim().toLowerCase();

/**
 * HR Manager from employee record: department "HR" + designation "Manager"
 */
export const isHrManagerProfile = (employee) => {
  if (!employee) return false;
  return normalize(employee.department) === "hr" && normalize(employee.designation) === "manager";
};

/**
 * Full task management: create, assign, edit all tasks, delete, board view.
 */
export const canManageTasks = (authUser, employee) => {
  const role = authUser?.role;
  if (["Admin", "HR", "Manager"].includes(role)) {
    return true;
  }
  return isHrManagerProfile(employee);
};

export const buildTaskCapabilities = (authUser, employee) => {
  const canManage = canManageTasks(authUser, employee);
  return {
    canManageTasks: canManage,
    canCreateTasks: canManage,
    canAssignTasks: canManage,
    /** Only assigned employees update % — HR/Manager changes status via workflow */
    canUpdateProgress: !canManage,
    canAddComments: true,
    canTrackStatus: true,
    workflow: TASK_STATUSES,
    department: employee?.department || null,
    designation: employee?.designation || null,
    isHrManager: isHrManagerProfile(employee),
    role: authUser?.role || null,
  };
};
