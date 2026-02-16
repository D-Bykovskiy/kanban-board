import axios from 'axios';
import type { Task, TaskCreate, TaskUpdate, TaskMove, TaskListResponse, TaskFilter } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api/tasks`,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const taskService = {
  async getTasks(filter?: TaskFilter): Promise<Task[]> {
    const params = new URLSearchParams();
    
    if (filter?.status) params.append('status', filter.status);
    if (filter?.priority) params.append('priority', filter.priority);
    if (filter?.assignee) params.append('assignee', filter.assignee);
    if (filter?.search) params.append('search', filter.search);
    if (filter?.tags?.length) {
      filter.tags.forEach(tag => params.append('tags', tag));
    }

    const response = await api.get<TaskListResponse>(`/?${params.toString()}`);
    return response.data.tasks;
  },

  async createTask(task: TaskCreate): Promise<Task> {
    const response = await api.post<Task>('/', task);
    return response.data;
  },

  async updateTask(taskId: string, updates: TaskUpdate): Promise<Task> {
    const response = await api.patch<Task>(`/${taskId}`, updates);
    return response.data;
  },

  async deleteTask(taskId: string): Promise<void> {
    await api.delete(`/${taskId}`);
  },

  async moveTask(taskId: string, moveData: TaskMove): Promise<Task> {
    const response = await api.post<Task>(`/${taskId}/move`, moveData);
    return response.data;
  },

  async reorderTasks(status: string, taskIds: string[]): Promise<void> {
    await api.post(`/reorder/${status}`, taskIds);
  },
};
