<script setup lang="ts">
import StatusBadge from "./StatusBadge.vue";
import type { TaskPriority, TaskStatus } from "../stores/tasks";

type WorkloadTask = {
  id: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
};

type WorkloadItem = {
  user: {
    id: string;
    name: string;
  };
  summary: {
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
  tasks: WorkloadTask[];
};

const props = defineProps<{
  item: WorkloadItem;
}>();

const priorityLabels: Record<TaskPriority, string> = {
  HIGH: "高",
  MEDIUM: "中",
  LOW: "低",
};
</script>

<template>
  <article class="workload-panel">
    <header class="workload-panel-header">
      <div>
        <h2>{{ props.item.user.name }}</h2>
        <p>主任务 {{ props.item.summary.total }} 个</p>
      </div>
      <span class="workload-total">{{ props.item.summary.total }}</span>
    </header>

    <dl class="workload-counts">
      <div>
        <dt>待处理</dt>
        <dd>{{ props.item.summary.todo }}</dd>
      </div>
      <div>
        <dt>进行中</dt>
        <dd>{{ props.item.summary.inProgress }}</dd>
      </div>
      <div>
        <dt>待验收</dt>
        <dd>{{ props.item.summary.inReview }}</dd>
      </div>
      <div>
        <dt>已完成</dt>
        <dd>{{ props.item.summary.done }}</dd>
      </div>
      <div class="workload-count-flag" :data-active="props.item.summary.blocked > 0">
        <dt>阻塞</dt>
        <dd>{{ props.item.summary.blocked }}</dd>
      </div>
    </dl>

    <dl class="priority-counts">
      <div class="priority-count-high" :data-active="props.item.summary.high > 0">
        <dt>高优先级</dt>
        <dd>{{ props.item.summary.high }}</dd>
      </div>
      <div>
        <dt>中优先级</dt>
        <dd>{{ props.item.summary.medium }}</dd>
      </div>
      <div>
        <dt>低优先级</dt>
        <dd>{{ props.item.summary.low }}</dd>
      </div>
    </dl>

    <div class="workload-task-list">
      <p v-if="props.item.tasks.length === 0" class="state-text">暂无当前任务。</p>
      <div v-for="task in props.item.tasks" v-else :key="task.id" class="workload-task-row">
        <span class="workload-task-title">{{ task.title }}</span>
        <StatusBadge :status="task.status" />
        <span class="priority-pill">优先级 {{ priorityLabels[task.priority] }}</span>
      </div>
    </div>
  </article>
</template>
