import { defineStore } from "pinia";

import { ApiError, apiFetch } from "../api/client";

export type TaskStatus = "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "DONE";
export type TaskPriority = "LOW" | "MEDIUM" | "HIGH";
export type CommentType = "COMMENT" | "PROGRESS" | "REVIEW";

type SimpleUser = {
  id: string;
  name: string;
};

type SimpleMilestone = {
  id: string;
  title: string;
};

export type TaskDependency = {
  dependsOnTask: {
    id: string;
    title: string;
    status: TaskStatus;
  };
};

export type TaskTag = {
  tag: {
    id: string;
    name: string;
    color: string;
  };
};

export type TaskListItem = {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  assignee: SimpleUser | null;
  milestone: SimpleMilestone | null;
  dependencies: TaskDependency[];
  tags: TaskTag[];
};

export type TaskDetail = TaskListItem & {
  creator: SimpleUser;
  reviewer: SimpleUser | null;
  subtasks: Array<{
    id: string;
    title: string;
    isDone: boolean;
  }>;
  comments: Array<{
    id: string;
    content: string;
    type: "COMMENT" | "PROGRESS" | "REVIEW";
    createdAt: string;
    author: {
      name: string;
    };
  }>;
};

export type UpdateTaskInput = {
  title?: string;
  description?: string;
  priority?: TaskPriority;
  assigneeId?: string | null;
  milestoneId?: string | null;
  dueDate?: string | null;
  tagIds?: string[];
  dependencyIds?: string[];
};

type TasksState = {
  tasks: TaskListItem[];
  currentTask: TaskDetail | null;
  loading: boolean;
  error: string;
};

function toChineseError(error: unknown, fallback: string) {
  if (error instanceof ApiError) {
    const messages: Record<string, string> = {
      FORBIDDEN: "当前账号没有权限执行此操作",
      NOT_FOUND: "任务不存在或已被删除",
      VALIDATION_ERROR: "提交内容不符合要求",
      TASK_DEPENDENCY_BLOCKED: "存在未完成的依赖任务，暂时不能推进状态",
      INVALID_TASK_TRANSITION: "当前任务状态不能这样流转",
    };

    return messages[error.code] ?? error.message ?? fallback;
  }

  return fallback;
}

export const useTasksStore = defineStore("tasks", {
  state: (): TasksState => ({
    tasks: [],
    currentTask: null,
    loading: false,
    error: "",
  }),
  actions: {
    async loadTasks() {
      this.loading = true;
      this.error = "";

      try {
        this.tasks = await apiFetch<TaskListItem[]>("/tasks");
      } catch (error) {
        this.error = toChineseError(error, "任务列表加载失败，请稍后重试");
        throw error;
      } finally {
        this.loading = false;
      }
    },
    async loadTask(id: string) {
      this.loading = true;
      this.error = "";

      try {
        this.currentTask = await apiFetch<TaskDetail>(`/tasks/${id}`);
      } catch (error) {
        this.currentTask = null;
        this.error = toChineseError(error, "任务详情加载失败，请稍后重试");
        throw error;
      } finally {
        this.loading = false;
      }
    },
    async changeStatus(id: string, status: TaskStatus) {
      this.error = "";

      try {
        await apiFetch<TaskDetail>(`/tasks/${id}/status`, {
          method: "POST",
          body: JSON.stringify({ status }),
        });

        if (this.currentTask?.id === id) {
          await this.loadTask(id);
        } else {
          await this.loadTasks();
        }
      } catch (error) {
        this.error = toChineseError(error, "任务状态更新失败，请稍后重试");
        throw error;
      }
    },
    async createTask(input: {
      title: string;
      description: string;
      priority: TaskPriority;
      assigneeId: string | null;
      milestoneId: string | null;
      dueDate: string | null;
      tagIds: string[];
      dependencyIds: string[];
    }) {
      this.error = "";

      try {
        const task = await apiFetch<TaskDetail>("/tasks", {
          method: "POST",
          body: JSON.stringify(input),
        });
        await this.loadTasks();
        return task;
      } catch (error) {
        this.error = toChineseError(error, "任务创建失败，请稍后重试");
        throw error;
      }
    },
    async updateTask(id: string, input: UpdateTaskInput) {
      this.error = "";

      try {
        await apiFetch<TaskDetail>(`/tasks/${id}`, {
          method: "PATCH",
          body: JSON.stringify(input),
        });

        if (this.currentTask?.id === id) {
          await this.loadTask(id);
        } else {
          await this.loadTasks();
        }
      } catch (error) {
        this.error = toChineseError(error, "任务更新失败，请稍后重试");
        throw error;
      }
    },
    async deleteTask(id: string) {
      this.error = "";

      try {
        await apiFetch<{ id: string }>(`/tasks/${id}`, {
          method: "DELETE",
        });

        if (this.currentTask?.id === id) {
          this.currentTask = null;
        }

        await this.loadTasks();
      } catch (error) {
        this.error = toChineseError(error, "任务删除失败，请稍后重试");
        throw error;
      }
    },
    async createComment(taskId: string, input: { content: string; type: CommentType }) {
      this.error = "";

      try {
        await apiFetch(`/tasks/${taskId}/comments`, {
          method: "POST",
          body: JSON.stringify(input),
        });
        await this.loadTask(taskId);
      } catch (error) {
        this.error = toChineseError(error, "评论提交失败，请稍后重试");
        throw error;
      }
    },
    async createSubtask(taskId: string, title: string) {
      this.error = "";

      try {
        await apiFetch(`/tasks/${taskId}/subtasks`, {
          method: "POST",
          body: JSON.stringify({ title }),
        });
        await this.loadTask(taskId);
      } catch (error) {
        this.error = toChineseError(error, "子任务创建失败，请稍后重试");
        throw error;
      }
    },
    async updateSubtask(id: string, isDone: boolean) {
      this.error = "";

      try {
        await apiFetch(`/subtasks/${id}`, {
          method: "PATCH",
          body: JSON.stringify({ isDone }),
        });

        if (this.currentTask) {
          await this.loadTask(this.currentTask.id);
        }
      } catch (error) {
        this.error = toChineseError(error, "子任务更新失败，请稍后重试");
        throw error;
      }
    },
  },
});
