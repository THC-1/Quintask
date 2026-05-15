<script setup lang="ts">
import type { TaskStatus } from "../stores/tasks";

const props = defineProps<{
  status: TaskStatus;
}>();

const labels: Record<TaskStatus, string> = {
  TODO: "待处理",
  IN_PROGRESS: "进行中",
  IN_REVIEW: "待验收",
  DONE: "已完成",
};

</script>

<template>
  <span class="status-badge" :data-status="props.status">
    {{ labels[props.status] }}
  </span>
</template>
