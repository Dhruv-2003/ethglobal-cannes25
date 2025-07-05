import { PrismaClient } from "@prisma/client";
import { Engine } from "./engine";

const prisma = new PrismaClient();

// Demo script to showcase the functionality
async function runDemo() {
  console.log("🎬 Starting Demo Script...");

  try {
    // Step 1: Create a demo user
    console.log("\n📝 Step 1: Creating demo user...");
    const user = await prisma.user.upsert({
      where: { email: "demo@cannes25.com" },
      update: {},
      create: {
        email: "demo@cannes25.com",
        name: "Demo User",
      },
    });
    console.log("✅ Demo user:", user);

    // Step 2: Create some demo tasks
    console.log("\n📋 Step 2: Creating demo tasks...");
    const tasks = await Promise.all([
      prisma.task.create({
        data: {
          title: "Setup hackathon project",
          description: "Initialize the backend with TypeScript and Prisma",
          userId: user.id,
        },
      }),
      prisma.task.create({
        data: {
          title: "Implement core features",
          description: "Add the main functionality for the hackathon",
          userId: user.id,
        },
      }),
      prisma.task.create({
        data: {
          title: "Test and deploy",
          description: "Test the application and prepare for deployment",
          userId: user.id,
          completed: true,
        },
      }),
    ]);
    console.log("✅ Demo tasks created:", tasks.length);

    // Step 3: Use the engine to process data
    console.log("\n🔧 Step 3: Testing engine...");
    const engine = new Engine();

    const demoData = {
      action: "demo_process",
      payload: {
        message: "This is a demo processing request",
        user: user.email,
        timestamp: new Date().toISOString(),
      },
    };

    const processedResult = await engine.processData(demoData);
    console.log("✅ Engine processing result:", processedResult);

    // Step 4: Auto-generate a task using the engine
    console.log("\n🤖 Step 4: Auto-generating task...");
    const autoTask = await engine.automateTask(
      user.id,
      "Demo Auto Task",
      "This task was automatically created by the demo script"
    );
    console.log("✅ Auto-generated task:", autoTask);

    // Step 5: Fetch and display all data
    console.log("\n📊 Step 5: Fetching all data...");
    const allUsers = await prisma.user.findMany({
      include: { tasks: true },
    });

    console.log("📈 Final state:");
    allUsers.forEach((u) => {
      console.log(`  User: ${u.name} (${u.email})`);
      u.tasks.forEach((t) => {
        console.log(`    - ${t.title} ${t.completed ? "✅" : "⏳"}`);
      });
    });

    console.log("\n🎉 Demo completed successfully!");
  } catch (error) {
    console.error("❌ Demo failed:", error);
  } finally {
    await prisma.$disconnect();
    console.log("👋 Demo finished");
  }
}

// Run if this file is executed directly
if (import.meta.main) {
  runDemo();
}

export { runDemo };
