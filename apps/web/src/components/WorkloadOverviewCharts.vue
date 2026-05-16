<script setup lang="ts">
import { computed } from "vue";

import type { WorkloadItem } from "../types/workload";

const props = defineProps<{
  workload: WorkloadItem[];
}>();

const statusSegments = computed(() => {
  const totals = props.workload.reduce(
    (result, item) => {
      result.todo += item.summary.todo;
      result.inProgress += item.summary.inProgress;
      result.inReview += item.summary.inReview;
      result.done += item.summary.done;
      return result;
    },
    { todo: 0, inProgress: 0, inReview: 0, done: 0 },
  );

  const total = totals.todo + totals.inProgress + totals.inReview + totals.done || 1;

  return [
    { label: "待处理", value: totals.todo, color: "#d7a844" },
    { label: "进行中", value: totals.inProgress, color: "#277a57" },
    { label: "待验收", value: totals.inReview, color: "#d4553f" },
    { label: "已完成", value: totals.done, color: "#6f9f5d" },
  ].map((segment) => ({
    ...segment,
    percent: Math.round((segment.value / total) * 100),
  }));
});

const memberBars = computed(() => {
  const maxTotal = Math.max(...props.workload.map((item) => item.summary.total), 1);

  return props.workload.map((item) => ({
    id: item.user.id,
    name: item.user.name,
    total: item.summary.total,
    done: item.summary.done,
    blocked: item.summary.blocked,
    width: `${Math.max((item.summary.total / maxTotal) * 100, item.summary.total > 0 ? 8 : 0)}%`,
  }));
});

const priorityTotals = computed(() =>
  props.workload.reduce(
    (result, item) => {
      result.high += item.summary.high;
      result.medium += item.summary.medium;
      result.low += item.summary.low;
      return result;
    },
    { high: 0, medium: 0, low: 0 },
  ),
);

const totalTasks = computed(() => props.workload.reduce((total, item) => total + item.summary.total, 0));
const doneTasks = computed(() => props.workload.reduce((total, item) => total + item.summary.done, 0));
const blockedTasks = computed(() => props.workload.reduce((total, item) => total + item.summary.blocked, 0));
const completionRate = computed(() => (totalTasks.value === 0 ? 0 : Math.round((doneTasks.value / totalTasks.value) * 100)));
</script>

<template>
  <section class="overview-chart-panel" aria-label="任务总览图表">
    <div class="overview-hero-metric">
      <p>完成率</p>
      <strong>{{ completionRate }}%</strong>
      <span>{{ doneTasks }} / {{ totalTasks }} 个任务已完成</span>
    </div>

    <div class="status-donut-card">
      <div
        class="status-donut"
        :style="{
          '--todo': `${statusSegments[0].percent}%`,
          '--progress': `${statusSegments[1].percent}%`,
          '--review': `${statusSegments[2].percent}%`,
          '--done': `${statusSegments[3].percent}%`,
        }"
      >
        <span>{{ totalTasks }}</span>
        <small>任务</small>
      </div>
      <div class="chart-legend">
        <div v-for="segment in statusSegments" :key="segment.label">
          <i :style="{ background: segment.color }"></i>
          <span>{{ segment.label }}</span>
          <strong>{{ segment.value }}</strong>
        </div>
      </div>
    </div>

    <div class="member-bars-card">
      <header>
        <h2>成员负载排行</h2>
        <span>{{ blockedTasks }} 个阻塞</span>
      </header>
      <div class="member-bar-list">
        <div v-for="member in memberBars" :key="member.id" class="member-bar-row">
          <div class="member-bar-label">
            <strong>{{ member.name }}</strong>
            <span>{{ member.done }}/{{ member.total }} 完成</span>
          </div>
          <div class="member-bar-track">
            <span :style="{ width: member.width }"></span>
          </div>
          <em v-if="member.blocked > 0">{{ member.blocked }} 阻塞</em>
        </div>
      </div>
    </div>

    <div class="priority-pyramid-card">
      <h2>优先级结构</h2>
      <div class="priority-pyramid">
        <span class="priority-high" :style="{ '--value': priorityTotals.high }">高 {{ priorityTotals.high }}</span>
        <span class="priority-medium" :style="{ '--value': priorityTotals.medium }">中 {{ priorityTotals.medium }}</span>
        <span class="priority-low" :style="{ '--value': priorityTotals.low }">低 {{ priorityTotals.low }}</span>
      </div>
    </div>
  </section>
</template>
