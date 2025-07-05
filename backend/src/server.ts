import { Hono } from "hono";
import { PrismaClient } from "@prisma/client";
import type { Context } from "hono";

// Initialize Prisma Client
const prisma = new PrismaClient();

// Initialize Hono app
const app = new Hono();

// Middleware for JSON parsing (built into Hono)
app.use("*", async (c: Context, next) => {
  console.log(`${c.req.method} ${c.req.url}`);
  await next();
});

// Health check endpoint
app.get("/", (c: Context) => {
  return c.json({ message: "Cannes 25 Backend API is running!" });
});

// User endpoints
app.get("/users", async (c: Context) => {
  try {
    const users = await prisma.user.findMany({
      include: { tasks: true },
    });
    return c.json(users);
  } catch (error) {
    return c.json({ error: "Failed to fetch users" }, 500);
  }
});

app.post("/users", async (c: Context) => {
  try {
    const { email, name } = await c.req.json();

    if (!email) {
      return c.json({ error: "Email is required" }, 400);
    }

    const user = await prisma.user.create({
      data: { email, name },
    });
    return c.json(user, 201);
  } catch (error) {
    return c.json({ error: "Failed to create user" }, 500);
  }
});

app.get("/users/:id", async (c: Context) => {
  try {
    const id = c.req.param("id");
    const user = await prisma.user.findUnique({
      where: { id },
      include: { tasks: true },
    });

    if (!user) {
      return c.json({ error: "User not found" }, 404);
    }

    return c.json(user);
  } catch (error) {
    return c.json({ error: "Failed to fetch user" }, 500);
  }
});

// Task endpoints
app.get("/tasks", async (c: Context) => {
  try {
    const tasks = await prisma.task.findMany({
      include: { user: true },
    });
    return c.json(tasks);
  } catch (error) {
    return c.json({ error: "Failed to fetch tasks" }, 500);
  }
});

app.post("/tasks", async (c: Context) => {
  try {
    const { title, description, userId } = await c.req.json();

    if (!title || !userId) {
      return c.json({ error: "Title and userId are required" }, 400);
    }

    const task = await prisma.task.create({
      data: { title, description, userId },
      include: { user: true },
    });
    return c.json(task, 201);
  } catch (error) {
    return c.json({ error: "Failed to create task" }, 500);
  }
});

app.patch("/tasks/:id", async (c: Context) => {
  try {
    const id = c.req.param("id");
    const { title, description, completed } = await c.req.json();

    const task = await prisma.task.update({
      where: { id },
      data: { title, description, completed },
      include: { user: true },
    });
    return c.json(task);
  } catch (error) {
    return c.json({ error: "Failed to update task" }, 500);
  }
});

app.delete("/tasks/:id", async (c: Context) => {
  try {
    const id = c.req.param("id");
    await prisma.task.delete({ where: { id } });
    return c.json({ message: "Task deleted successfully" });
  } catch (error) {
    return c.json({ error: "Failed to delete task" }, 500);
  }
});

// Custom endpoint for your hackathon logic
app.post("/process", async (c: Context) => {
  try {
    const { action, data } = await c.req.json();

    // Add your custom processing logic here
    console.log("Processing action:", action, "with data:", data);

    // Example: Create a task based on processing result
    if (action === "create_task_from_process") {
      const task = await prisma.task.create({
        data: {
          title: `Processed: ${data.title}`,
          description: `Auto-generated from process: ${data.description}`,
          userId: data.userId,
        },
      });
      return c.json({ success: true, task });
    }

    return c.json({
      success: true,
      message: "Process completed",
      result: data,
    });
  } catch (error) {
    return c.json({ error: "Processing failed" }, 500);
  }
});

// Graceful shutdown
const gracefulShutdown = async () => {
  console.log("Shutting down gracefully...");
  await prisma.$disconnect();
  process.exit(0);
};

process.on("SIGINT", gracefulShutdown);
process.on("SIGTERM", gracefulShutdown);

// Start server
const port = process.env.PORT || 3000;
console.log(`🚀 Server starting on port ${port}`);

export default {
  port,
  fetch: app.fetch,
};
