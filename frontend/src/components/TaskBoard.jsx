import React from "react";
import TaskCard from "./TaskCard";

const COLUMNS = ["To Do", "In Progress", "Review", "Completed"];

const columnStyles = {
  "To Do": "border-slate-200 bg-slate-50",
  "In Progress": "border-blue-200 bg-blue-50",
  Review: "border-amber-200 bg-amber-50",
  Completed: "border-green-200 bg-green-50",
};

const TaskBoard = ({ tasks, onEdit, onAddComment, onDelete }) => {
  const tasksByStatus = COLUMNS.reduce((acc, status) => {
    acc[status] = tasks.filter((t) => t.status === status);
    return acc;
  }, {});

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      {COLUMNS.map((status) => (
        <div
          key={status}
          className={`rounded-2xl border-2 p-4 min-h-[400px] ${columnStyles[status]}`}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-800">{status}</h2>
            <span className="text-sm font-medium text-gray-500 bg-white px-2.5 py-0.5 rounded-full">
              {tasksByStatus[status].length}
            </span>
          </div>
          <div className="space-y-3">
            {tasksByStatus[status].map((task) => (
              <TaskCard
                key={task._id}
                task={task}
                onEdit={onEdit}
                onAddComment={onAddComment}
                onDelete={onDelete}
              />
            ))}
            {tasksByStatus[status].length === 0 && (
              <p className="text-sm text-gray-400 text-center py-8">No tasks</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default TaskBoard;
