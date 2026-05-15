const nodeEnv = process.env.NODE_ENV ?? "development";
const jwtSecret = process.env.JWT_SECRET ?? "quintask-dev-secret";

if (nodeEnv === "production" && !process.env.JWT_SECRET) {
  throw new Error("生产环境必须配置 JWT_SECRET。");
}

export const config = {
  port: Number(process.env.PORT ?? 3000),
  jwtSecret,
  nodeEnv,
};
