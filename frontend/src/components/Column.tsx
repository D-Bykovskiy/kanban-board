import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { MoreHorizontal, CheckCircle2, Clock } from 'lucide-react';
import { TaskCard } from './TaskCard';
import type { Task, TaskStatus } from '../types';

interface ColumnProps {
  status: TaskStatus;
  title: string;
  color: string;
  tasks: Task[];
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string, taskTitle: string) => void;
}

const statusIcons: Record<TaskStatus, React.ReactNode> = {
  todo: <CheckCircle2 className="w-4 h-4 text-white" />,
  in_progress: <Clock className="w-4 h-4 text-white" />,
  done: <CheckCircle2 className="w-4 h-4 text-white" />,
};

export function Column({
  status,
  title,
  color,
  tasks,
  onEditTask,
  onDeleteTask,
}: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  const isDone = status === 'done';

  return (
    <div className="flex flex-col">
      {/* Column Header */}
      <div className={`${color} rounded-t-lg px-4 py-3 flex items-center justify-between`}>
        <div className="flex items-center gap-2">
          {statusIcons[status]}
          <span className="text-white font-medium">{title}</span>
          <span className="bg-white/30 text-white text-xs px-2 py-0.5 rounded-full">
            {tasks.length}
          </span>
        </div>
        <button className="p-1 hover:bg-white/20 rounded transition-colors">
          <MoreHorizontal className="w-5 h-5 text-white/80" />
        </button>
      </div>

      {/* Column Content */}
      <div
        ref={setNodeRef}
        className={`bg-gray-50 min-h-[400px] p-3 rounded-b-lg border border-t-0 border-gray-200 ${
          isOver ? 'ring-2 ring-kanban-blue ring-opacity-50' : ''
        }`}
      >
        <SortableContext
          items={tasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onEdit={onEditTask}
                onDelete={onDeleteTask}
              />
            ))}
          </div>
        </SortableContext>

        {/* Empty State for Done Column */}
        {isDone && tasks.length > 0 && (
          <div className="mt-4 p-6 border-2 border-dashed border-gray-300 rounded-lg bg-white/50 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 mb-3">
              <svg viewBox="0 0 64 64" className="w-full h-full">
                <rect x="12" y="8" width="40" height="48" rx="4" fill="#e8f4f8" stroke="#5b9bd5" strokeWidth="2"/>
                <path d="M24 28 L30 34 L42 22" stroke="#70ad47" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="48" cy="16" r="10" fill="#70ad47"/>
                <path d="M44 16 L47 19 L52 13" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h4 className="text-gray-700 font-medium mb-1">All tasks completed!</h4>
            <p className="text-gray-500 text-sm">Great job!</p>
          </div>
        )}
      </div>
    </div>
  );
}
