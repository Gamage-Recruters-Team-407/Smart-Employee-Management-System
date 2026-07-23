import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import useTaskCapabilities from "../hooks/useTaskCapabilities";

/** Task management: Admin/HR/Manager role OR employee profile department=HR & designation=Manager */
const ManagerRoute = ({ children }) => {
  const { canManageTasks, loading } = useTaskCapabilities();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-500">
        <Loader2 className="animate-spin mr-2" size={24} />
        Checking permissions…
      </div>
    );
  }

  if (!canManageTasks) {
    return <Navigate to="/tasks" replace />;
  }

  return children;
};

export default ManagerRoute;
