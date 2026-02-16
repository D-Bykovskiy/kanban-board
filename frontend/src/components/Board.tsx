import { useEffect, useState, useCallback } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { 
  Search, 
  Bell, 
  HelpCircle, 
  ChevronDown, 
  Plus,
  CheckSquare
} from 'lucide-react';
import { Column } from './Column';
import { TaskCard } from './TaskCard';
import { TaskForm } from './TaskForm';
import { ConfirmDialog } from './ConfirmDialog';
import { ToastContainer, type Toast } from './Toast';
import { useTaskStore } from '../store';
import type { Task, TaskCreate, TaskUpdate } from '../types';
import { TaskStatus } from '../types';

const columns: { id: TaskStatus; title: string; color: string }[] = [
  { id: TaskStatus.TODO, title: 'To Do', color: 'bg-kanban-blue' },
  { id: TaskStatus.IN_PROGRESS, title: 'In Progress', color: 'bg-kanban-yellow' },
  { id: TaskStatus.DONE, title: 'Done', color: 'bg-kanban-green' },
];

export function Board() {
  const {
    tasks,
    error,
    filter,
    loadTasks,
    addTask,
    updateTask,
    deleteTask,
    moveTask,
    setFilter,
    getTasksByStatus,
    clearError,
  } = useTaskStore();

  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [initialStatus, setInitialStatus] = useState<TaskStatus>(TaskStatus.TODO);
  
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    taskId: string | null;
    taskTitle: string;
  }>({ isOpen: false, taskId: null, taskTitle: '' });
  
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const addToast = useCallback((message: string, type: Toast['type']) => {
    const newToast: Toast = {
      id: Date.now().toString() + Math.random().toString(),
      message,
      type,
    };
    setToasts((prev) => [...prev, newToast]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = tasks.find((t) => t.id === active.id);
    if (task) {
      setActiveTask(task);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;
    const activeId = active.id;
    const overId = over.id;
    if (activeId === overId) return;
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);
    if (!over) return;
    const activeId = active.id as string;
    const overId = over.id as string;
    const activeTask = tasks.find((t) => t.id === activeId);
    if (!activeTask) return;
    const columnIds = columns.map((c) => c.id);
    if (columnIds.includes(overId as TaskStatus)) {
      const newStatus = overId as TaskStatus;
      if (activeTask.status !== newStatus) {
        const tasksInColumn = getTasksByStatus(newStatus);
        await moveTask(activeId, { status: newStatus, position: tasksInColumn.length });
        addToast(`Task moved to ${columns.find(c => c.id === newStatus)?.title}`, 'success');
      }
      return;
    }
    const overTask = tasks.find((t) => t.id === overId);
    if (!overTask) return;
    if (activeTask.status !== overTask.status) {
      const newPosition = overTask.position;
      await moveTask(activeId, { status: overTask.status, position: newPosition });
      addToast(`Task moved to ${columns.find(c => c.id === overTask.status)?.title}`, 'success');
    } else {
      const columnTasks = getTasksByStatus(activeTask.status);
      const oldIndex = columnTasks.findIndex((t) => t.id === activeId);
      const newIndex = columnTasks.findIndex((t) => t.id === overId);
      if (oldIndex !== newIndex) {
        const reorderedTasks = arrayMove(columnTasks, oldIndex, newIndex);
        const taskIds = reorderedTasks.map((t) => t.id);
        await useTaskStore.getState().reorderTasks(activeTask.status, taskIds);
      }
    }
  };

  const handleAddTask = (status: TaskStatus) => {
    setInitialStatus(status);
    setEditingTask(null);
    setIsFormOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setInitialStatus(task.status);
    setIsFormOpen(true);
  };

  const handleDeleteClick = (taskId: string, taskTitle: string) => {
    setConfirmDialog({ isOpen: true, taskId, taskTitle });
  };

  const handleConfirmDelete = async () => {
    if (confirmDialog.taskId) {
      try {
        await deleteTask(confirmDialog.taskId);
        addToast('Task deleted successfully', 'success');
      } catch {
        addToast('Failed to delete task', 'error');
      }
    }
    setConfirmDialog({ isOpen: false, taskId: null, taskTitle: '' });
  };

  const handleCancelDelete = () => {
    setConfirmDialog({ isOpen: false, taskId: null, taskTitle: '' });
  };

  const handleFormSubmit = async (data: TaskCreate | TaskUpdate) => {
    try {
      if (editingTask) {
        await updateTask(editingTask.id, data as TaskUpdate);
        addToast('Task updated successfully', 'success');
      } else {
        await addTask(data as TaskCreate);
        addToast('Task created successfully', 'success');
      }
    } catch {
      addToast(editingTask ? 'Failed to update task' : 'Failed to create task', 'error');
    }
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingTask(null);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setFilter({ ...filter, search: query || undefined });
  };

  return (
    <div className="min-h-screen bg-[#f0f4f8]">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-3 sticky top-0 z-50">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          {/* Left: Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-kanban-blue rounded-lg flex items-center justify-center">
              <CheckSquare className="w-5 h-5 text-white" />
            </div>
            <span className="text-gray-700 font-semibold text-lg">Project Kanban</span>
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </div>

          {/* Center: Search */}
          <div className="flex-1 max-w-xl mx-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search..."
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-kanban-blue focus:border-transparent"
              />
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-4">
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <Bell className="w-5 h-5 text-gray-500" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <HelpCircle className="w-5 h-5 text-gray-500" />
            </button>
            <div className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 rounded-lg p-1 transition-colors">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                JD
              </div>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-6">
        {/* Add Task Button */}
        <div className="flex justify-end mb-6">
          <button
            onClick={() => handleAddTask(TaskStatus.TODO)}
            className="flex items-center gap-2 px-4 py-2 bg-kanban-blue hover:bg-blue-600 text-white rounded-lg font-medium transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add Task
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <div className="w-5 h-5 text-red-500">⚠</div>
            <p className="flex-1 text-red-700 text-sm">{error}</p>
            <button
              onClick={clearError}
              className="text-sm text-red-600 hover:text-red-800 font-medium"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Board */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <div className="grid grid-cols-3 gap-6">
              {columns.map((column) => (
                <Column
                  key={column.id}
                  status={column.id}
                  title={column.title}
                  color={column.color}
                  tasks={getTasksByStatus(column.id)}
                  onEditTask={handleEditTask}
                  onDeleteTask={handleDeleteClick}
                />
              ))}
            </div>

            <DragOverlay>
              {activeTask ? (
                <TaskCard
                  task={activeTask}
                  onEdit={() => {}}
                  onDelete={() => {}}
                  isDragging
                />
              ) : null}
            </DragOverlay>
          </DndContext>
        </div>
      </main>

      {/* Task Form Modal */}
      <TaskForm
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        onSubmit={handleFormSubmit}
        task={editingTask}
        initialStatus={initialStatus}
      />

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title="Delete Task?"
        message={`Are you sure you want to delete "${confirmDialog.taskTitle}"?`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        variant="danger"
      />

      {/* Toast Container */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
