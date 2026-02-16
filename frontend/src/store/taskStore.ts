import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { Task, TaskCreate, TaskUpdate, TaskMove, TaskStatus, TaskFilter } from '../types';
import { taskService } from '../services';

interface TaskState {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  filter: TaskFilter;
  
  // Actions
  loadTasks: () => Promise<void>;
  addTask: (task: TaskCreate) => Promise<Task>;
  updateTask: (taskId: string, updates: TaskUpdate) => Promise<Task>;
  deleteTask: (taskId: string) => Promise<void>;
  moveTask: (taskId: string, moveData: TaskMove) => Promise<void>;
  reorderTasks: (status: TaskStatus, taskIds: string[]) => Promise<void>;
  setFilter: (filter: TaskFilter) => void;
  clearError: () => void;
  
  // Getters
  getTasksByStatus: (status: TaskStatus) => Task[];
  getTaskById: (taskId: string) => Task | undefined;
  getAllTags: () => string[];
  getAllAssignees: () => string[];
}

export const useTaskStore = create<TaskState>()(
  devtools(
    (set, get) => ({
      tasks: [],
      loading: false,
      error: null,
      filter: {},

      loadTasks: async () => {
        set({ loading: true, error: null });
        try {
          const tasks = await taskService.getTasks(get().filter);
          set({ tasks, loading: false });
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to load tasks', 
            loading: false 
          });
        }
      },

      addTask: async (task) => {
        set({ loading: true, error: null });
        try {
          const newTask = await taskService.createTask(task);
          set((state) => ({ 
            tasks: [...state.tasks, newTask], 
            loading: false 
          }));
          return newTask;
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to create task', 
            loading: false 
          });
          throw error;
        }
      },

      updateTask: async (taskId, updates) => {
        set({ loading: true, error: null });
        try {
          const updatedTask = await taskService.updateTask(taskId, updates);
          set((state) => ({
            tasks: state.tasks.map((t) => (t.id === taskId ? updatedTask : t)),
            loading: false,
          }));
          return updatedTask;
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to update task', 
            loading: false 
          });
          throw error;
        }
      },

      deleteTask: async (taskId) => {
        set({ loading: true, error: null });
        try {
          await taskService.deleteTask(taskId);
          set((state) => ({
            tasks: state.tasks.filter((t) => t.id !== taskId),
            loading: false,
          }));
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to delete task', 
            loading: false 
          });
          throw error;
        }
      },

      moveTask: async (taskId, moveData) => {
        set({ loading: true, error: null });
        try {
          await taskService.moveTask(taskId, moveData);
          // Refresh tasks to get updated positions
          await get().loadTasks();
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to move task', 
            loading: false 
          });
          throw error;
        }
      },

      reorderTasks: async (status, taskIds) => {
        try {
          await taskService.reorderTasks(status, taskIds);
          await get().loadTasks();
        } catch (error) {
          set({ 
            error: error instanceof Error ? error.message : 'Failed to reorder tasks' 
          });
          throw error;
        }
      },

      setFilter: (filter) => {
        set({ filter });
        get().loadTasks();
      },

      clearError: () => set({ error: null }),

      getTasksByStatus: (status) => {
        return get().tasks
          .filter((t) => t.status === status)
          .sort((a, b) => a.position - b.position);
      },

      getTaskById: (taskId) => {
        return get().tasks.find((t) => t.id === taskId);
      },

      getAllTags: () => {
        const tags = new Set<string>();
        get().tasks.forEach((task) => {
          task.tags.forEach((tag) => tags.add(tag));
        });
        return Array.from(tags).sort();
      },

      getAllAssignees: () => {
        const assignees = new Set<string>();
        get().tasks.forEach((task) => {
          if (task.assignee) assignees.add(task.assignee);
        });
        return Array.from(assignees).sort();
      },
    }),
    { name: 'TaskStore' }
  )
);
