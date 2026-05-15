<script setup lang="ts">
import type { TaskStatus } from "../stores/tasks";

const props = defineProps<{
  status: string;
}>();

const labels: Record<TaskStatus, string> = {
  TODO: "待处理",
  IN_PROGRESS: "进行中",
  IN_REVIEW: "待验收",
  DONE: "已完成",
};

function statusLabel(status: string) {
  return labels[status as TaskStatus] ?? status;
}
</script>

<template>
  <span class="status-badge" :data-status="props.status">
    {{ statusLabel(props.status) }}
  </span>
</template>
