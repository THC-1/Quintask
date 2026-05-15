import { Hono } from "hono";
import { cors } from "hono/cors";

import "./types/hono.js";
import { authRoutes } from "./modules/auth/routes.js";
import { handleError, ok } from "./lib/http.js";

export const app = new Hono();

app.use("*", cors());

app.get("/api/health", (c) => ok(c, { status: "ok" }));

app.route("/api/auth", authRoutes);

app.onError(handleError);
