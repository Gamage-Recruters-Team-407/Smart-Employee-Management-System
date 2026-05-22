<<<<<<< refs/remotes/origin/Fawdhan
import React from 'react';

const Performance = () => {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Performance Tracking</h1>
      <div className="bg-white rounded-2xl shadow p-8">
        <p>Performance Reviews, Ratings, KPI Tracking</p>
      </div>
    </div>
  );
};

export default Performance;
=======
import React, { useEffect, useState } from "react";
import PerformanceChart from "../components/PerformanceChart";
import API from "../services/performanceApi";

export default function Performance() {
  const [performances, setPerformances] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await API.getAll();
        setPerformances(res.data || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4">Performance Management</h2>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="col-span-2">
            <PerformanceChart data={performances} />
            <div className="mt-6 bg-white shadow rounded p-4">
              <h3 className="font-medium mb-2">Performance Summary</h3>
              <table className="w-full table-auto text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-500">
                    <th className="pb-2">Employee</th>
                    <th className="pb-2">Attendance %</th>
                    <th className="pb-2">Task Completion</th>
                    <th className="pb-2">Quality</th>
                    <th className="pb-2">Overall</th>
                  </tr>
                </thead>
                <tbody>
                  {performances.map((p) => (
                    <tr key={p._id} className="border-t">
                      <td className="py-2">{p.employee?.name?.name || p.employee}</td>
                      <td className="py-2">{p.attendancePercent}%</td>
                      <td className="py-2">{p.tasksAssigned ? `${Math.round((p.tasksCompleted / p.tasksAssigned) * 100)}%` : "-"}</td>
                      <td className="py-2">{p.qualityScore}</td>
                      <td className="py-2">{p.overallScore}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="col-span-1">
            <div className="bg-white shadow rounded p-4">
              <h3 className="font-medium mb-2">Top Performers</h3>
              <ol className="list-decimal pl-5 text-sm">
                {performances
                  .slice()
                  .sort((a, b) => b.overallScore - a.overallScore)
                  .slice(0, 5)
                  .map((p) => (
                    <li key={p._id} className="py-1">
                      {p.employee?.name?.name || p.employee} — {p.overallScore}
                    </li>
                  ))}
              </ol>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
>>>>>>> local
