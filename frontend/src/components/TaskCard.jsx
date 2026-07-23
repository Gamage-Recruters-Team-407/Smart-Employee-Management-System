import React, { useState } from "react";
import { Calendar, MessageSquare, User, Pencil, Trash2 } from "lucide-react";

const WORKFLOW = ["To Do", "In Progress", "Review", "Completed"];

const TaskCard = ({
  task,
  onEdit,
  onAddComment,
  onDelete,
  onStatusChange,
  onProgressChange,
  canManage = false,
  canEditProgress = false,
}) => {
  const [commentText, setCommentText] = useState("");
  const [showComments, setShowComments] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState(task.progress ?? 0);

  const assigneeName = task.assignedTo
    ? `${task.assignedTo.firstName || ""} ${task.assignedTo.lastName || ""}`.trim() ||
      task.assignedTo.employeeId
    : "Unassigned";

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setSubmitting(true);
    try {
      await onAddComment(task._id, commentText.trim());
      setCommentText("");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start gap-2 mb-2">
        <h3 className="font-semibold text-gray-800 leading-tight">{task.title}</h3>
        {canManage && (
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => onEdit(task)}
              className="p-1.5 text-gray-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50"
              title="Edit task"
            >
              <Pencil size={16} />
            </button>
            <button
              type="button"
              onClick={() => onDelete(task._id)}
              className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50"
              title="Delete task"
            >
              <Trash2 size={16} />
            </button>
          </div>
        )}
      </div>

      {task.description && (
        <p className="text-sm text-gray-500 mb-3 line-clamp-2">{task.description}</p>
      )}

      <div className="flex items-center gap-1.5 text-sm text-gray-600 mb-2">
        <User size={14} />
        <span>{assigneeName}</span>
      </div>

      {task.dueDate && (
        <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-2">
          <Calendar size={14} />
          <span>{new Date(task.dueDate).toLocaleDateString()}</span>
        </div>
      )}
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
          {task.status}
        </span>
        <span className="text-xs text-gray-500">
          Progress: <span className="font-semibold text-gray-700">{task.progress ?? 0}%</span>
        </span>
      </div>

      <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-3">
        <div
          className="h-full bg-indigo-500 rounded-full transition-all"
          style={{ width: `${task.progress ?? 0}%` }}
        />
      </div>
      {canEditProgress && onProgressChange && (
        <div className="mb-3">
          <label className="text-xs text-gray-500 block mb-1">Update progress</label>
          <input
            type="range"
            min={0}
            max={100}
            value={progress}
            onChange={(e) => setProgress(Number(e.target.value))}
            onMouseUp={() => onProgressChange(task._id, progress)}
            onTouchEnd={() => onProgressChange(task._id, progress)}
            className="w-full accent-indigo-600"
          />
        </div>
      )}

      {canManage && !canEditProgress && (
        <p className="text-xs text-gray-400 mb-3">
          Employee updates progress and status from <strong>My Tasks</strong>.
        </p>
      )}

      {canEditProgress && onStatusChange && (
        <div className="flex flex-wrap gap-1 mb-3">
          {WORKFLOW.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onStatusChange(task._id, s)}
              className={`text-[10px] px-2 py-0.5 rounded border transition ${
                task.status === s
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "bg-white text-gray-600 border-gray-200 hover:border-indigo-300"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      )}
      <button
        type="button"
        onClick={() => setShowComments(!showComments)}
        className="flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-700"
      >
        <MessageSquare size={14} />
        {task.comments?.length || 0} comment{(task.comments?.length || 0) !== 1 ? "s" : ""}
      </button>

      {showComments && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="space-y-2 max-h-32 overflow-y-auto mb-3">
            {task.comments?.length ? (
              task.comments.map((c, i) => (
                <div key={c._id || i} className="bg-gray-50 rounded-lg p-2 text-sm">
                  <p className="text-gray-800">{c.text}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {c.author} · {new Date(c.createdAt).toLocaleString()}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-400">No comments yet</p>
            )}
          </div>
          {(canManage || onAddComment) && (
            <form onSubmit={handleCommentSubmit} className="flex gap-2">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Add a comment..."
                className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="submit"
                disabled={submitting || !commentText.trim()}
                className="px-3 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 disabled:opacity-50"
              >
                Add
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
};

export default TaskCard;
