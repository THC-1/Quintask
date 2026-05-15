import { createRouter, createWebHistory, type RouteRecordRaw } from "vue-router";

import BoardView from "./views/BoardView.vue";
import DashboardView from "./views/DashboardView.vue";
import LoginView from "./views/LoginView.vue";
import MembersView from "./views/MembersView.vue";
import MilestonesView from "./views/MilestonesView.vue";
import TaskDetailView from "./views/TaskDetailView.vue";
import WorkloadView from "./views/WorkloadView.vue";
import { useAuthStore } from "./stores/auth";

const routes: RouteRecordRaw[] = [
  { path: "/login", name: "login", component: LoginView, meta: { public: true } },
  { path: "/", redirect: "/dashboard" },
  { path: "/dashboard", name: "dashboard", component: DashboardView },
  { path: "/board", name: "board", component: BoardView },
  { path: "/tasks/:id", name: "task-detail", component: TaskDetailView },
  { path: "/milestones", name: "milestones", component: MilestonesView },
  { path: "/workload", name: "workload", component: WorkloadView },
  { path: "/members", name: "members", component: MembersView, meta: { requiresOwner: true } }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

router.beforeEach(async (to) => {
  const auth = useAuthStore();
  const isLoginRoute = to.name === "login";

  if (auth.token && !auth.user) {
    try {
      await auth.loadMe();
    } catch {
      auth.logout();

      if (!isLoginRoute) {
        return { name: "login", query: { redirect: to.fullPath } };
      }
    }
  }

  if (isLoginRoute && auth.user) {
    return { name: "dashboard" };
  }

  if (!to.meta.public && !auth.user) {
    return { name: "login", query: { redirect: to.fullPath } };
  }

  if (to.meta.requiresOwner && !auth.isOwner) {
    return { name: "dashboard" };
  }

  return true;
});

export default router;
