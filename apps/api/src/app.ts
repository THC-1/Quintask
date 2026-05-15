import { Hono } from "hono";
import { cors } from "hono/cors";

import "./types/hono.js";
import { authRoutes } from "./modules/auth/routes.js";
import { commentRoutes } from "./modules/comments/routes.js";
import { subtaskRoutes } from "./modules/subtasks/routes.js";
import { tagRoutes } from "./modules/tags/routes.js";
import { taskRoutes } from "./modules/tasks/routes.js";
import { handleError, ok } from "./lib/http.js";

export const app = new Hono();

app.use("*", cors());

app.get("/api/health", (c) => ok(c, { status: "ok" }));

app.route("/api/auth", authRoutes);
app.route("/api/tasks", taskRoutes);
app.route("/api", commentRoutes);
app.route("/api", subtaskRoutes);
app.route("/api/tags", tagRoutes);

app.onError(handleError);
