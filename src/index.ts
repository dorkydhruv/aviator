import { Hono } from "hono";
import { cors } from "hono/cors";
import aviator from "./aviator/route";
const app = new Hono();

app.get("/", (c) => {
  return c.json({
    message: "Welcome to Aviator!",
  });
});

app.use(
  cors({
    origin: "*",
    allowMethods: ["GET", "POST", "PUT", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization", "Accept-Encoding"],
  })
);

app.route("/aviator", aviator);

export default app;
