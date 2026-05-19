import { TaskPriority, UserRole, type TaskPriority as TaskPriorityType } from "@quintask/shared";

type TaskCreateScalarInput = {
  role: string;
  priority: TaskPriorityType;
  assigneeId?: string | null;
  milestoneId?: string | null;
  dueDate?: string | null;
};

type TaskCreateRelationInput = {
  role: string;
  tagIds: string[];
  dependencyIds: string[];
};

type TaskUpdateRelationInput = {
  tagIds?: string[];
  dependencyIds?: string[];
};

const unsupportedTaskUpdateFields = ["status"] as const;

export function getUnsupportedTaskUpdateFields(input: object) {
  return unsupportedTaskUpdateFields.filter((field) => Object.hasOwn(input, field));
}

export function normalizeCreateTaskScalars(input: TaskCreateScalarInput) {
  if (input.role !== UserRole.OWNER) {
    return {
      priority: TaskPriority.MEDIUM,
      assigneeId: null,
      milestoneId: null,
      dueDate: null,
    };
  }

  return {
    priority: input.priority,
    assigneeId: input.assigneeId ?? null,
    milestoneId: input.milestoneId ?? null,
    dueDate: input.dueDate ?? null,
  };
}

export function normalizeCreateTaskRelations(input: TaskCreateRelationInput) {
  if (input.role !== UserRole.OWNER) {
    return {
      tagIds: [],
      dependencyIds: [],
    };
  }

  return {
    tagIds: [...new Set(input.tagIds)],
    dependencyIds: [...new Set(input.dependencyIds)],
  };
}

export function normalizeUpdateTaskRelations(input: TaskUpdateRelationInput) {
  return {
    tagIds: input.tagIds === undefined ? undefined : [...new Set(input.tagIds)],
    dependencyIds: input.dependencyIds === undefined ? undefined : [...new Set(input.dependencyIds)],
  };
}

export function hasSelfDependency(taskId: string, dependencyIds: string[] | undefined) {
  return dependencyIds?.includes(taskId) ?? false;
}
