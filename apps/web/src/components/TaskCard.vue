<script setup lang="ts">
import { computed } from "vue";
import { useRouter } from "vue-router";

import StatusBadge from "./StatusBadge.vue";
import type { TaskListItem, TaskPriority } from "../stores/tasks";

const props = defineProps<{
  task: TaskListItem;
}>();

const router = useRouter();

const priorityLabels: Record<TaskPriority, string> = {
  HIGH: "高",
  MEDIUM: "中",
  LOW: "低",
};

const isBlocked = computed(() =>
  props.task.dependencies.some((dependency) => dependency.dependsOnTask.status !== "DONE"),
);

function openTask() {
  router.push({ name: "task-detail", params: { id: props.task.id } });
}
</script>

<template>
  <article
    class="task-card"
    role="button"
    tabindex="0"
    @click="openTask"
    @keydown.enter.prevent="openTask"
    @keydown.space.prevent="openTask"
  >
    <div class="task-card-header">
      <h3>{{ task.title }}</h3>
      <StatusBadge :status="task.status" />
    </div>

    <p v-if="task.description" class="task-card-description">{{ task.description }}</p>

    <div class="task-card-meta">
      <span>{{ task.assignee?.name ?? "未分配" }}</span>
      <span>优先级 {{ priorityLabels[task.priority] }}</span>
    </div>

    <p v-if="isBlocked" class="blocked-warning">有未完成依赖</p>

    <div v-if="task.tags.length > 0" class="tag-list" aria-label="任务标签">
      <span
        v-for="item in task.tags"
        :key="item.tag.id"
        class="task-tag"
        :style="{ '--tag-color': item.tag.color }"
      >
        {{ item.tag.name }}
      </span>
    </div>
  </article>
</template>
