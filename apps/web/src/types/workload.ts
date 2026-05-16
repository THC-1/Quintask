import type { TaskPriority, TaskStatus } from "../stores/tasks";

export type WorkloadTask = {
  id: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
};

export type WorkloadSummary = {
  total: number;
  todo: number;
  inProgress: number;
  inReview: number;
  done: number;
  blocked: number;
  high: number;
  medium: number;
  low: number;
};

export type WorkloadItem = {
  user: {
    id: string;
    name: string;
  };
  summary: WorkloadSummary;
  tasks: WorkloadTask[];
};
