import jwt from "jsonwebtoken";
import type { UserRole } from "@prisma/client";

import { config } from "../config.js";

export interface TokenPayload {
  userId: string;
  role: Extract<UserRole, "OWNER" | "MEMBER" | "TEACHER">;
}

export function signToken(payload: TokenPayload) {
  return jwt.sign(payload, config.jwtSecret, { expiresIn: "7d" });
}

export function verifyToken(token: string) {
  return jwt.verify(token, config.jwtSecret) as TokenPayload;
}
