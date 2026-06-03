import React, { useMemo } from "react";
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Title,
  Tooltip
} from "chart.js";
import { Bar, Pie } from "react-chartjs-2";

ChartJS.register(BarElement, CategoryScale, LinearScale, ArcElement, Tooltip, Legend, Title);

const scoreDistribution = (records) => {
  return records.reduce(
    (acc, item) => {
      if (item.overallScore >= 85) acc.excellent += 1;
      else if (item.overallScore >= 70) acc.good += 1;
      else acc.improvement += 1;
      return acc;
    },
    { excellent: 0, good: 0, improvement: 0 }
  );
};

const PerformanceChart = ({ data }) => {
  const records = data || [];

  const barData = useMemo(() => {
    return {
      labels: records.map((item) => item.employee?.name || "Employee"),
      datasets: [
        {
          label: "Attendance Score",
          data: records.map((item) => item.attendanceScore || 0),
          backgroundColor: "#2563eb"
        },
        {
          label: "Task Completion Rate",
          data: records.map((item) => item.taskCompletionRate || 0),
          backgroundColor: "#059669"
        },
        {
          label: "Quality Score",
          data: records.map((item) => item.qualityScore || 0),
          backgroundColor: "#f59e0b"
        },
        {
          label: "Overall Score",
          data: records.map((item) => item.overallScore || 0),
          backgroundColor: "#7c3aed"
        }
      ]
    };
  }, [records]);

  const pieData = useMemo(() => {
    const distribution = scoreDistribution(records);
    return {
      labels: ["Excellent (>=85)", "Good (70-84)", "Needs Improvement (<70)"],
      datasets: [
        {
          data: [distribution.excellent, distribution.good, distribution.improvement],
          backgroundColor: ["#16a34a", "#0ea5e9", "#ef4444"]
        }
      ]
    };
  }, [records]);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      <div className="bg-white rounded-2xl shadow p-5">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Performance Score Comparison</h3>
        <div className="h-[340px]">
          <Bar
            data={barData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              scales: {
                y: {
                  beginAtZero: true,
                  max: 100
                }
              }
            }}
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow p-5">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Overall Distribution</h3>
        <div className="h-[340px]">
          <Pie
            data={pieData}
            options={{
              responsive: true,
              maintainAspectRatio: false
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default PerformanceChart;
