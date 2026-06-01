export const EMPLOYEE_PROFILE_UPDATED = "sems:employee-profile-updated";

/** Notify dashboards to refresh when an employee record changes. */
export const notifyEmployeeProfileUpdated = (employee) => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(EMPLOYEE_PROFILE_UPDATED, { detail: employee ?? null })
  );
};
