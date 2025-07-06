import { Order, PrismaClient } from "@prisma/client";
import { JsonObject } from "@prisma/client/runtime/library";
import { createPublicClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { base } from "viem/chains";
import { fillContractOrder } from "./utils/1inch";
import { LimitOrderV4Struct } from "@1inch/limit-order-sdk";

const prisma = new PrismaClient();

const TAKER_PRIVATE_KEY =
  (process.env.TAKER_PRIVATE_KEY as `0x${string}`) || "0xYOUR_PRIVATE_KEY";

const takerWallet = privateKeyToAccount(TAKER_PRIVATE_KEY);

const takerWalletClient = createWalletClient({
  account: takerWallet,
  chain: base,
  transport: http(),
});

const publicClient = createPublicClient({
  chain: base,
  transport: http(),
});

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

      // TODO: NOT FILLING THE ORDER YET
      //   const orderFillResult = await fillOrder(order);

      const orderFillResult = {
        success: true,
        transactionHash:
          "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
        error: null,
      };

      if (orderFillResult.success) {
        // Mark order as completed in database
        await prisma.order.update({
          where: { id: order.id },
          data: {
            completed: true,
            data: {
              ...(order.data as object),
              filledAt: new Date().toISOString(),
              txHash: orderFillResult.transactionHash,
            },
          },
        });
        console.log(`✅ Order ${order.id} filled successfully`);
      } else {
        console.error(`❌ Failed to fill order ${order.id}`);
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
async function fillOrder(order: Order) {
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
    console.log(`🔑 Using wallet: ${takerWallet.address}`);

    const orderData = order.data as JsonObject;

    // Simulate building transaction
    console.log("🏗️ Building transaction...");

    // Simulate signing transaction
    console.log("✍️ Signing transaction...");
    // const signedTx = await wallet.signTransaction(txData);

    // Simulate submitting to blockchain
    console.log("📡 Submitting to blockchain...");
    // const txHash = await submitTransaction(signedTx);

    const txHash = await fillContractOrder({
      takerWallet: takerWalletClient,
      order: orderData.order as LimitOrderV4Struct,
      signature: orderData.signature as `0x${string}`,
    });

    // Simulate waiting for confirmation
    console.log("⏳ Waiting for confirmation...");
    // await waitForConfirmation(txHash);

    const tx = await publicClient.waitForTransactionReceipt({
      hash: txHash,
    });

    tx.transactionHash;
    // Simulate successful fill
    console.log("✅ Order filled on-chain");

    return {
      success: true,
      transactionHash: tx.transactionHash,
    };
  } catch (error) {
    console.error("❌ Order fill failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Run if this file is executed directly
if (import.meta.main) {
  runDemo();
}

export { runDemo };
