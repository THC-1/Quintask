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

const WEEK1_START = new Date(2026, 4, 11); // May 11, 2026 (Monday)

export type WeekWindow = {
  label: string;
  hint: string;
  startDay: number;
  endDay: number;
};

function dayNumberFromDate(date: Date) {
  const diffMs = date.getTime() - WEEK1_START.getTime();
  if (diffMs < 0) return null;
  const totalDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));
  const fullWeeks = Math.floor(totalDays / 7);
  const dayInWeek = totalDays % 7; // 0=Mon … 4=Fri, 5=Sat, 6=Sun
  if (dayInWeek >= 5) return null; // weekend
  return fullWeeks * 5 + dayInWeek + 1;
}

export function getCurrentWeekIndex(today?: Date): number {
  const dayNumber = dayNumberFromDate(today ?? new Date());
  if (dayNumber === null) return 0;
  const index = Math.floor((dayNumber - 1) / 5);
  return Math.min(index, 3);
}

export function getWeekWindows(today?: Date): WeekWindow[] {
  const currentIndex = getCurrentWeekIndex(today);

  const weeks: WeekWindow[] = [];
  for (let i = 0; i < 4; i++) {
    const startDay = i * 5 + 1;
    const endDay = (i + 1) * 5;
    weeks.push({
      label: i === currentIndex ? "本周任务" : `第 ${i + 1} 周`,
      hint: `Day ${startDay}-${endDay}`,
      startDay,
      endDay,
    });
  }

  return weeks;
}

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

export function filterTasksByWeek(tasks: TaskListItem[], week: WeekWindow, today?: Date) {
  const currentWeek = getWeekWindows(today)[getCurrentWeekIndex(today)];

  return sortTasksBySchedule(
    tasks.filter((task) => {
      const dayNumber = dayNumberFromTask(task);
      if (dayNumber === null) {
        return week.startDay === currentWeek.startDay;
      }
      return dayNumber >= week.startDay && dayNumber <= week.endDay;
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
