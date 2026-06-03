import { Navigate } from "react-router-dom";
import EmployeeTasks from "./EmployeeTasks";
import useTaskCapabilities from "../hooks/useTaskCapabilities";

/** My assigned tasks — employees and non–HR managers only. */
const TasksRouter = () => {
  const { isHrManager, loading } = useTaskCapabilities();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh] text-gray-500">
        Loading…
      </div>
    );
  }

  if (isHrManager) {
    return <Navigate to="/tasks/manage" replace />;
  }

  return <EmployeeTasks />;
};

export default TasksRouter;