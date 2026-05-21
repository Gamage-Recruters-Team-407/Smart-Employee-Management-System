import DashboardStats from "./DashboardStats";
import RecentActivity from "./RecentActivity";

const DashboardHome = () => {
  return (
    <>
      <DashboardStats />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <RecentActivity />
      </div>
    </>
  );
};

export default DashboardHome;