import jwt from "jsonwebtoken";

import { config } from "../config.js";
import { verifyToken } from "./token.js";

describe("verifyToken", () => {
  it("rejects tokens with malformed payloads", () => {
    const token = jwt.sign({ userId: 123, role: "OWNER" }, config.jwtSecret);

    expect(() => verifyToken(token)).toThrow("Invalid token payload");
  });
});
