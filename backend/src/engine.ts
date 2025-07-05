import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Engine class for processing actions
class Engine {
  async processData(data: any) {
    console.log("🔧 Engine processing data:", data);

    // Add your processing logic here
    // This could be AI processing, data transformation, etc.

    const processedResult = {
      originalData: data,
      processedAt: new Date().toISOString(),
      status: "processed",
      result: `Processed: ${JSON.stringify(data)}`,
    };

    console.log("✅ Processing complete:", processedResult);
    return processedResult;
  }

  async automateTask(
    userId: string,
    taskTitle: string,
    taskDescription?: string
  ) {
    console.log("🤖 Auto-creating task for user:", userId);

    try {
      const task = await prisma.task.create({
        data: {
          title: taskTitle,
          description: taskDescription || "Auto-generated task",
          userId,
        },
      });

      console.log("✅ Task created:", task);
      return task;
    } catch (error) {
      console.error("❌ Failed to create task:", error);
      throw error;
    }
  }

  async batchProcess(items: any[]) {
    console.log("📦 Batch processing", items.length, "items");

    const results = [];
    for (const item of items) {
      const result = await this.processData(item);
      results.push(result);
    }

    console.log("✅ Batch processing complete");
    return results;
  }
}

// Example usage
async function runEngine() {
  console.log("🚀 Starting Engine...");

  const engine = new Engine();

  try {
    // Example 1: Process some data
    const sampleData = { message: "Hello from engine", timestamp: Date.now() };
    await engine.processData(sampleData);

    // Example 2: Auto-create a task (you'll need a valid user ID)
    // Uncomment this when you have users in your database
    // await engine.automateTask('your-user-id', 'Engine Generated Task', 'This task was created by the engine')

    // Example 3: Batch processing
    const batchData = [
      { id: 1, name: "Item 1" },
      { id: 2, name: "Item 2" },
      { id: 3, name: "Item 3" },
    ];
    await engine.batchProcess(batchData);
  } catch (error) {
    console.error("❌ Engine error:", error);
  } finally {
    await prisma.$disconnect();
    console.log("👋 Engine finished");
  }
}

// Run if this file is executed directly
if (import.meta.main) {
  runEngine();
}

export { Engine };
