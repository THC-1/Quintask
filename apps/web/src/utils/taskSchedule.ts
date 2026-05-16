import type { TaskListItem } from "../stores/tasks";

export const taskCategoryOptions = [
  { value: "ALL", label: "全部分类" },
  { value: "产品", label: "产品" },
  { value: "后端", label: "后端" },
  { value: "前端", label: "前端" },
  { value: "小程序", label: "小程序" },
  { value: "后台", label: "后台" },
  { value: "测试", label: "测试" },
] as const;

export type TaskCategory = (typeof taskCategoryOptions)[number]["value"];

export const weekWindows = [
  {
    label: "第 1 周",
    hint: "Day 1-5",
    startDay: 1,
    endDay: 5,
  },
  {
    label: "本周任务",
    hint: "Day 8-10",
    startDay: 8,
    endDay: 10,
  },
  {
    label: "提前查看第 3 周",
    hint: "Day 11-15",
    startDay: 11,
    endDay: 15,
  },
  {
    label: "提前查看第 4 周",
    hint: "Day 16-20",
    startDay: 16,
    endDay: 20,
  },
];

export function dayNumberFromTask(task: TaskListItem) {
  const titleMatch = task.title.match(/^Day\s+(\d+)/i);

  if (titleMatch) {
    return Number(titleMatch[1]);
  }

  const descriptionMatch = task.description.match(/Day\s+(\d+)/i);
  return descriptionMatch ? Number(descriptionMatch[1]) : null;
}

export function sortTasksBySchedule(tasks: TaskListItem[]) {
  return [...tasks].sort((left, right) => {
    const leftDay = dayNumberFromTask(left) ?? 0;
    const rightDay = dayNumberFromTask(right) ?? 0;
    return leftDay - rightDay || (left.dueDate ?? "").localeCompare(right.dueDate ?? "");
  });
}

export function filterTasksByWeek(tasks: TaskListItem[], week: (typeof weekWindows)[number]) {
  return sortTasksBySchedule(
    tasks.filter((task) => {
      const dayNumber = dayNumberFromTask(task);
      return dayNumber !== null && dayNumber >= week.startDay && dayNumber <= week.endDay;
    }),
  );
}

export function categoryFromQuery(value: unknown): TaskCategory {
  return taskCategoryOptions.some((option) => option.value === value) ? (value as TaskCategory) : "ALL";
}

export function filterTasksByCategory(tasks: TaskListItem[], category: TaskCategory) {
  if (category === "ALL") {
    return tasks;
  }

  return tasks.filter((task) => task.tags.some((item) => item.tag.name === category));
}
