import { Hono } from "hono";
import { cors } from "hono/cors";
import { PrismaClient } from "@prisma/client";
import type { Context } from "hono";
import { Engine } from "./engine";

// Initialize Prisma Client
const prisma = new PrismaClient();

// Initialize Hono app
const app = new Hono();

// Initialize Engine
const engine = new Engine();

// CORS middleware to allow frontend requests
app.use(
  "*",
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:3001",
      "http://localhost:5173",
      "http://localhost:8080",
    ],
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  })
);

// Middleware for JSON parsing and logging
app.use("*", async (c: Context, next) => {
  console.log(`${c.req.method} ${c.req.url}`);
  await next();
});

// Health check endpoint
app.get("/", (c: Context) => {
  return c.json({ message: "Cannes 25 Backend API is running!" });
});

// Order endpoints
app.get("/orders", async (c: Context) => {
  try {
    const orders = await prisma.order.findMany({
      orderBy: { createdAt: "desc" },
    });
    return c.json(orders);
  } catch (error) {
    return c.json({ error: "Failed to fetch orders" }, 500);
  }
});

app.get("/orders/:id", async (c: Context) => {
  try {
    const id = c.req.param("id");
    const order = await prisma.order.findUnique({
      where: { id },
    });

    if (!order) {
      return c.json({ error: "Order not found" }, 404);
    }

    return c.json(order);
  } catch (error) {
    return c.json({ error: "Failed to fetch order" }, 500);
  }
});

app.post("/orders", async (c: Context) => {
  try {
    const { userAddress, makerToken, data } = await c.req.json();

    if (!userAddress || !makerToken) {
      return c.json({ error: "userAddress and makerToken are required" }, 400);
    }

    const order = await prisma.order.create({
      data: {
        userAddress,
        makerToken,
        data: data || {},
      },
    });
    return c.json(order, 201);
  } catch (error) {
    return c.json({ error: "Failed to create order" }, 500);
  }
});

app.patch("/orders/:id", async (c: Context) => {
  try {
    const id = c.req.param("id");
    const { userAddress, makerToken, data, completed } = await c.req.json();

    const order = await prisma.order.update({
      where: { id },
      data: { userAddress, makerToken, data, completed },
    });
    return c.json(order);
  } catch (error) {
    return c.json({ error: "Failed to update order" }, 500);
  }
});

app.delete("/orders/:id", async (c: Context) => {
  try {
    const id = c.req.param("id");
    await prisma.order.delete({ where: { id } });
    return c.json({ message: "Order deleted successfully" });
  } catch (error) {
    return c.json({ error: "Failed to delete order" }, 500);
  }
});

// Get orders by user address
app.get("/orders/user/:address", async (c: Context) => {
  try {
    const address = c.req.param("address");
    const orders = await prisma.order.findMany({
      where: { userAddress: address },
      orderBy: { createdAt: "desc" },
    });
    return c.json(orders);
  } catch (error) {
    return c.json({ error: "Failed to fetch user orders" }, 500);
  }
});

// Mark order as completed
app.patch("/orders/:id/complete", async (c: Context) => {
  try {
    const id = c.req.param("id");
    const order = await prisma.order.update({
      where: { id },
      data: { completed: true },
    });
    return c.json(order);
  } catch (error) {
    return c.json({ error: "Failed to complete order" }, 500);
  }
});

// Custom endpoint for order processing
// NOTE: Might not be needed
app.post("/process", async (c: Context) => {
  try {
    const { action, data } = await c.req.json();

    // Add your custom processing logic here
    console.log("Processing action:", action, "with data:", data);

    // Example: Create an order based on processing result
    if (action === "create_order_from_process") {
      const order = await prisma.order.create({
        data: {
          userAddress: data.userAddress,
          makerToken: data.makerToken,
          data: {
            processed: true,
            originalData: data,
            processedAt: new Date().toISOString(),
          },
        },
      });
      return c.json({ success: true, order });
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

// Zen Mode endpoints
app.post("/zen-mode/activate", async (c: Context) => {
  try {
    const { userAddress, preferences } = await c.req.json();

    if (!userAddress || !preferences) {
      console.error("Missing userAddress or preferences");
      return c.json({ error: "userAddress and preferences are required" }, 400);
    }

    // Check if user already has zen mode active
    const existingZenUser = await prisma.zenModeUser.findUnique({
      where: { userAddress },
    });

    let zenUser;
    if (existingZenUser) {
      // Update existing zen mode user
      zenUser = await prisma.zenModeUser.update({
        where: { userAddress },
        data: {
          preferences,
          isActive: true,
          updatedAt: new Date(),
        },
      });
    } else {
      // Create new zen mode user
      zenUser = await prisma.zenModeUser.create({
        data: {
          userAddress,
          preferences,
          isActive: true,
        },
      });
    }

    // Initialize engine monitoring if this is the first active user
    await engine.initializeMonitoring();

    return c.json(
      {
        success: true,
        message: "Zen mode activated successfully",
        zenUser,
      },
      201
    );
  } catch (error) {
    console.error("Error activating zen mode:", error);
    return c.json({ error: "Failed to activate zen mode" }, 500);
  }
});

app.post("/zen-mode/deactivate", async (c: Context) => {
  try {
    const { userAddress } = await c.req.json();

    if (!userAddress) {
      return c.json({ error: "userAddress is required" }, 400);
    }

    const zenUser = await prisma.zenModeUser.findUnique({
      where: { userAddress },
    });

    if (!zenUser) {
      return c.json({ error: "User not found in zen mode" }, 404);
    }

    const updatedZenUser = await prisma.zenModeUser.update({
      where: { userAddress },
      data: { isActive: false },
    });

    // Check if engine monitoring should stop
    await engine.checkAndStopMonitoring();

    return c.json({
      success: true,
      message: "Zen mode deactivated successfully",
      zenUser: updatedZenUser,
    });
  } catch (error) {
    return c.json({ error: "Failed to deactivate zen mode" }, 500);
  }
});

app.get("/zen-mode/users", async (c: Context) => {
  try {
    const activeZenUsers = await prisma.zenModeUser.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
    });

    return c.json({
      success: true,
      count: activeZenUsers.length,
      users: activeZenUsers,
    });
  } catch (error) {
    return c.json({ error: "Failed to fetch zen mode users" }, 500);
  }
});

app.get("/zen-mode/users/:address", async (c: Context) => {
  try {
    const address = c.req.param("address");
    const zenUser = await prisma.zenModeUser.findUnique({
      where: { userAddress: address },
    });

    if (!zenUser) {
      return c.json({ error: "User not found in zen mode" }, 404);
    }

    return c.json({
      success: true,
      zenUser,
    });
  } catch (error) {
    return c.json({ error: "Failed to fetch zen mode user" }, 500);
  }
});

app.patch("/zen-mode/users/:address/preferences", async (c: Context) => {
  try {
    const address = c.req.param("address");
    const { preferences } = await c.req.json();

    if (!preferences) {
      return c.json({ error: "preferences are required" }, 400);
    }

    const zenUser = await prisma.zenModeUser.update({
      where: { userAddress: address },
      data: { preferences },
    });

    return c.json({
      success: true,
      message: "Preferences updated successfully",
      zenUser,
    });
  } catch (error) {
    return c.json({ error: "Failed to update preferences" }, 500);
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
