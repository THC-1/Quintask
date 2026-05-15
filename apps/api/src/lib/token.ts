import jwt from "jsonwebtoken";
import type { UserRole } from "@prisma/client";

import { config } from "../config.js";

export interface TokenPayload {
  userId: string;
  role: Extract<UserRole, "OWNER" | "MEMBER" | "TEACHER">;
}

const tokenRoles: TokenPayload["role"][] = ["OWNER", "MEMBER", "TEACHER"];

export function signToken(payload: TokenPayload) {
  return jwt.sign(payload, config.jwtSecret, { expiresIn: "7d" });
}

export function verifyToken(token: string) {
  const decoded = jwt.verify(token, config.jwtSecret);

  if (
    typeof decoded !== "object" ||
    decoded === null ||
    Array.isArray(decoded) ||
    typeof decoded.userId !== "string" ||
    !tokenRoles.includes(decoded.role as TokenPayload["role"])
  ) {
    throw new Error("Invalid token payload");
  }

  return {
    userId: decoded.userId,
    role: decoded.role as TokenPayload["role"],
  };
}
