import { Route, Routes } from "react-router-dom";
import { MockAuthProvider } from "./context/MockAuthContext";
import Dashboard from "./pages/Dashboard";
import Employees from "./pages/Employees";
import DashboardHome from "./components/common/DashboardHome";
import Performance from "./pages/Performance";
import Attendance from "./pages/Attendance";
import Leave from "./pages/Leave";
import Payroll from "./pages/Payroll";
import Tasks from "./pages/Tasks";
import EmployeeAccount from "./pages/EmployeeAccount";
import MyTasks from "./pages/MyTasks";

function App() {
  return (
    <MockAuthProvider>
    <Routes>
      <Route path="/" element={<Dashboard />}>
        <Route index element={<DashboardHome />} />
        <Route path="employees" element={<Employees />} />
        <Route path="employees/:id" element={<EmployeeAccount />} />
        <Route path="attendance" element={<Attendance />} />
        <Route path="leaves" element={<Leave />} />
        <Route path="payroll" element={<Payroll />} />
        <Route path="performance" element={<Performance />} />
        <Route path="tasks" element={<Tasks />} />
        <Route path="my-tasks" element={<MyTasks />} />
      </Route>
    </Routes>
    </MockAuthProvider>
  );
}

export default App;
