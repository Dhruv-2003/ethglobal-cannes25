import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Demo script to showcase the functionality
// 1. This script will have a hardcoded or even an argument to fill a certain order with an order ID
// 2. Then it can call the server to get the order
// 3. Fill the order on chain
async function runDemo() {
  console.log("🎬 Starting Demo Script - Acting as Order Taker...");

  try {
    // Step 1: Look for open orders that can be filled
    console.log("\n� Step 1: Looking for open orders to fill...");

    const openOrders = await prisma.order.findMany({
      where: { completed: false },
      orderBy: { createdAt: "desc" },
    });

    if (openOrders.length === 0) {
      console.log("⚠️ No open orders found to fill");
      return;
    }

    console.log(`✅ Found ${openOrders.length} open orders`);

    // Step 2: Display available orders
    console.log("\n📋 Step 2: Available orders:");
    openOrders.forEach((order, index) => {
      console.log(`  ${index + 1}. Order ${order.id.slice(0, 8)}...`);
      console.log(`     User: ${order.userAddress.slice(0, 6)}...`);
      console.log(`     Token: ${order.makerToken}`);
      console.log(`     Created: ${order.createdAt.toISOString()}`);
      console.log(`     Data: ${JSON.stringify(order.data, null, 6)}`);
    });

    // Step 3: Fill orders on chain (simulated)
    console.log("\n⛓️ Step 3: Filling orders on chain...");

    for (const order of openOrders) {
      console.log(`\n🔨 Processing order ${order.id}...`);

      // TODO: Add your on-chain order filling logic here
      const orderFillResult = await simulateOrderFill(order);

      if (orderFillResult.success) {
        // Mark order as completed in database
        await prisma.order.update({
          where: { id: order.id },
          data: {
            completed: true,
            data: {
              ...(order.data as object),
              filledAt: new Date().toISOString(),
              txHash: orderFillResult.txHash,
              fillPrice: orderFillResult.fillPrice,
            },
          },
        });
        console.log(`✅ Order ${order.id} filled successfully`);
      } else {
        console.log(
          `❌ Order ${order.id} failed to fill:`,
          orderFillResult.error
        );
      }
    }

    // Step 4: Display final state
    console.log("\n📊 Step 4: Final state...");
    const finalOrders = await prisma.order.findMany({
      orderBy: { createdAt: "desc" },
    });

    console.log("📈 All orders:");
    finalOrders.forEach((order) => {
      const status = order.completed ? "✅ FILLED" : "⏳ PENDING";
      console.log(
        `  ${status} Order ${order.id.slice(
          0,
          8
        )}... - ${order.userAddress.slice(0, 6)}...`
      );
      console.log(`    Token: ${order.makerToken}`);
      console.log(`    Data: ${JSON.stringify(order.data, null, 2)}`);
    });

    console.log("\n🎉 Demo completed successfully!");
  } catch (error) {
    console.error("❌ Demo failed:", error);
  } finally {
    await prisma.$disconnect();
    console.log("👋 Demo finished");
  }
}

// Helper function to simulate on-chain order filling
async function simulateOrderFill(order: any) {
  console.log("🔨 Simulating on-chain order fill...");

  // TODO: Replace this with actual blockchain interaction
  // This is where you would:
  // 1. Connect to wallet
  // 2. Build the transaction
  // 3. Sign and submit to blockchain
  // 4. Wait for confirmation

  try {
    // Simulate wallet connection
    console.log("� Connecting to wallet...");
    // const wallet = await connectWallet();

    // Simulate building transaction
    console.log("🏗️ Building transaction...");
    const txData = await buildOrderFillTransaction(order);

    // Simulate signing transaction
    console.log("✍️ Signing transaction...");
    // const signedTx = await wallet.signTransaction(txData);

    // Simulate submitting to blockchain
    console.log("📡 Submitting to blockchain...");
    // const txHash = await submitTransaction(signedTx);

    // Simulate waiting for confirmation
    console.log("⏳ Waiting for confirmation...");
    // await waitForConfirmation(txHash);

    // Simulate successful fill
    const mockTxHash = "0x" + Math.random().toString(16).substr(2, 64);
    const mockFillPrice =
      parseFloat(order.data.price || "0") * (0.99 + Math.random() * 0.02); // +/- 1%

    console.log("✅ Order filled on-chain");

    return {
      success: true,
      txHash: mockTxHash,
      fillPrice: mockFillPrice.toString(),
      gasUsed: "21000",
      blockNumber: Math.floor(Math.random() * 1000000) + 18000000,
    };
  } catch (error) {
    console.error("❌ Order fill failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Helper function to build order fill transaction
async function buildOrderFillTransaction(order: any) {
  console.log("🏗️ Building order fill transaction for order:", order.id);

  // TODO: Implement actual transaction building logic
  // This would typically involve:
  // 1. Getting the order details
  // 2. Calculating gas requirements
  // 3. Building the contract call data
  // 4. Setting gas price and limits

  return {
    to: "0xDEX_CONTRACT_ADDRESS", // Replace with actual DEX contract
    data: "0x" + "fillOrder".padEnd(64, "0"), // Placeholder function call
    value: "0",
    gasLimit: "200000",
    gasPrice: "20000000000", // 20 gwei
    nonce: Math.floor(Math.random() * 1000000),
  };
}

// TODO: Implement these wallet functions
/*
async function connectWallet() {
  // Connect to MetaMask, WalletConnect, or other wallet
  // Return wallet instance
}

async function submitTransaction(signedTx: any) {
  // Submit signed transaction to blockchain
  // Return transaction hash
}

async function waitForConfirmation(txHash: string) {
  // Wait for transaction to be confirmed
  // Return receipt
}
*/

// Run if this file is executed directly
if (import.meta.main) {
  runDemo();
}

export { runDemo };
