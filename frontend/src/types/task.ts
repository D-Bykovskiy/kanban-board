export enum TaskStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  DONE = 'done',
}

export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  due_date?: string;
  tags: string[];
  assignee?: string;
  estimated_hours?: number;
  actual_hours?: number;
  parent_id?: string;
  position: number;
  created_at: string;
  updated_at?: string;
  content?: string;
  calendar_event_id?: string;
  telegram_message_id?: string;
}

export interface TaskCreate {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  due_date?: string;
  tags?: string[];
  assignee?: string;
  estimated_hours?: number;
  parent_id?: string;
  position?: number;
  content?: string;
}

export interface TaskUpdate {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  due_date?: string;
  tags?: string[];
  assignee?: string;
  estimated_hours?: number;
  actual_hours?: number;
  parent_id?: string;
  position?: number;
  content?: string;
}

export interface TaskMove {
  status: TaskStatus;
  position: number;
}

export interface TaskListResponse {
  tasks: Task[];
  total: number;
}

export interface TaskFilter {
  status?: TaskStatus;
  priority?: TaskPriority;
  assignee?: string;
  tags?: string[];
  search?: string;
}
