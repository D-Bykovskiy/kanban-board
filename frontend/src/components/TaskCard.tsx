import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Task } from '../types';

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string, taskTitle: string) => void;
  isDragging?: boolean;
}

export function TaskCard({ task, onEdit, onDelete: _onDelete, isDragging: isOverlayDragging }: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: isDragging || isOverlayDragging
      ? `${CSS.Transform.toString(transform)}` 
      : CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    onEdit(task);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={handleClick}
      className={`
        bg-white border border-gray-200 rounded-lg p-4 
        cursor-pointer hover:shadow-md hover:border-gray-300
        transition-all duration-200
        ${isDragging || isOverlayDragging ? 'shadow-lg ring-2 ring-kanban-blue ring-opacity-50 rotate-2' : ''}
      `}
    >
      <h3 className="text-gray-800 font-normal text-sm leading-relaxed">
        {task.title}
      </h3>
    </div>
  );
}
