import { PrismaClient, ZenModeUser, Order } from "@prisma/client";
import { createPublicClient, erc20Abi, http, PublicClient } from "viem";
import { base } from "viem/chains";
import { createNewOrder, CreateNewOrderResponse } from "./utils/1inch";
import { privateKeyToAccount } from "viem/accounts";

const prisma = new PrismaClient();

// Interfaces for better type safety
interface MarketData {
  prices: Record<string, number>;
  volume: number;
  timestamp: number;
}

interface UserBalance {
  tokenBalance: bigint;
  tokenDecimals: number;
}

interface OrderDetails {
  makerToken: string;
  takerToken: string;
  amount: string;
  price: number;
  data: {
    strategy: string;
    calculatedAt: string;
    marketPrice: number;
    userPreferences: any;
  };
}

const enginePrivateKey =
  (process.env.ENGINE_PRIVATE_KEY as `0x${string}`) || "";
const engineWallet = privateKeyToAccount(enginePrivateKey);

const publicClient = createPublicClient({
  chain: base,
  transport: http(),
});

// Engine class for processing actions
// 1. Receives a request to activate zen mode for a user
// 2. Regularly looks at the account and market and creates new order for the user
// 3. Continues to monitor the market and updates the order if required (Optional)
class Engine {
  private monitoringInterval: NodeJS.Timeout | null = null;

  // Get active zen mode users from database
  async getActiveZenUsers(): Promise<ZenModeUser[]> {
    try {
      const activeUsers = await prisma.zenModeUser.findMany({
        where: { isActive: true },
      });
      console.log(`📊 Found ${activeUsers.length} active zen mode users`);
      return activeUsers;
    } catch (error) {
      console.error("❌ Failed to fetch active zen users:", error);
      return [];
    }
  }

  // Start monitoring (now uses database)
  async startMarketMonitoring() {
    console.log("👀 Starting market monitoring...");

    this.monitoringInterval = setInterval(async () => {
      try {
        await this.checkAndCreateOrders();
      } catch (error) {
        console.error("❌ Market monitoring error:", error);
      }
    }, 30000); // Check every 30 seconds (adjust as needed)
  }

  private async checkAndCreateOrders() {
    console.log("🔍 Checking market conditions for zen mode users...");

    const activeZenUsers = await this.getActiveZenUsers();

    if (activeZenUsers.length === 0) {
      console.log("No active zen mode users found");
      return;
    }

    for (const zenUser of activeZenUsers) {
      try {
        if (!zenUser.preferences) {
          continue; // Skip if no preferences set
        }

        // @ts-ignore
        const token = zenUser.preferences.token as `0x${string}`;

        // // TODO: Add your market analysis logic here
        // const marketData = await this.getMarketData();
        // Example data
        const marketData: MarketData = {
          prices: { ETH: 2000, USDC: 1 },
          volume: 1000000,
          timestamp: Date.now(),
        };

        const userBalance = await this.getUserBalance(
          zenUser.userAddress as `0x${string}`,
          token
        );

        // Check if order should be created based on conditions
        const shouldCreateOrder = await this.shouldCreateOrder(
          zenUser,
          marketData,
          userBalance
        );

        if (shouldCreateOrder) {
          const order = await this.calculateOptimalOrder(
            zenUser,
            marketData,
            userBalance
          );
          await this.createOrderForUser(zenUser.userAddress, order);

          // Update last check time in database
          await prisma.zenModeUser.update({
            where: { id: zenUser.id },
            data: { lastOrderCheck: new Date() },
          });
        }
      } catch (error) {
        console.error(
          `❌ Error processing user ${zenUser.userAddress}:`,
          error
        );
      }
    }
  }

  // Initialize monitoring if there are active users
  async initializeMonitoring() {
    const activeUsers = await this.getActiveZenUsers();
    if (activeUsers.length > 0 && !this.monitoringInterval) {
      await this.startMarketMonitoring();
    }
  }

  // Stop monitoring if no active users
  async checkAndStopMonitoring() {
    const activeUsers = await this.getActiveZenUsers();
    if (activeUsers.length === 0 && this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      console.log("⏹️ Market monitoring stopped - no active zen mode users");
    }
  }

  // Step 3: Monitor and update existing orders (Optional)
  async monitorAndUpdateOrders() {
    console.log("📊 Monitoring existing orders for updates...");

    try {
      const activeOrders = await prisma.order.findMany({
        where: { completed: false },
      });

      for (const order of activeOrders) {
        // TODO: Add logic to check if order needs updating
        const shouldUpdate = await this.shouldUpdateOrder(order);

        if (shouldUpdate) {
          const updatedOrderData = await this.calculateOrderUpdate(order);
          await this.updateOrder(order.id, updatedOrderData);
        }
      }
    } catch (error) {
      console.error("❌ Error monitoring orders:", error);
    }
  }

  // Helper methods - implement these with your actual logic
  //   private async getMarketData(): Promise<MarketData> {
  //     // TODO: Implement market data fetching
  //     // This could be from DEX APIs, price feeds, etc.
  //     console.log("📈 Fetching market data...");
  //     return {
  //       prices: { ETH: 2000, USDC: 1 },
  //       volume: 1000000,
  //       timestamp: Date.now(),
  //     };
  //   }

  private async getUserBalance(
    userAddress: `0x${string}`,
    tokenAddress: `0x${string}`
  ): Promise<UserBalance> {
    console.log("💰 Checking user balance for:", userAddress);
    const balance = await publicClient.readContract({
      address: tokenAddress,
      abi: erc20Abi,
      functionName: "balanceOf",
      args: [userAddress],
    });

    const decimals = await publicClient.readContract({
      address: tokenAddress,
      abi: erc20Abi,
      functionName: "decimals",
    });

    return {
      tokenBalance: balance,
      tokenDecimals: decimals,
    };
  }

  private async shouldCreateOrder(
    zenUser: ZenModeUser,
    marketData: MarketData,
    userBalance: UserBalance
  ): Promise<boolean> {
    // TODO: Implement your logic for when to create orders
    // This could be based on price movements, time intervals, balance thresholds, etc.
    console.log("🤔 Evaluating if order should be created...");

    // Example logic - implement your own
    const timeSinceLastOrder = zenUser.lastOrderCheck
      ? Date.now() - new Date(zenUser.lastOrderCheck).getTime()
      : Infinity;

    return timeSinceLastOrder > 300000; // 5 minutes example
  }

  private async calculateOptimalOrder(
    zenUser: ZenModeUser,
    marketData: MarketData,
    userBalance: UserBalance
  ): Promise<CreateNewOrderResponse> {
    console.log("🧮 Calculating optimal order...");

    if (!zenUser.preferences) {
      throw new Error("User preferences not set");
    }

    // User can define define how much they want to make in terms of max amount
    // @ts-ignore
    const makingAmount = BigInt(zenUser.preferences.amount.toString());

    // Need to charge the taker a 1BP fee ( No consideration of market prices for now)
    const takingAmount = BigInt((makingAmount * 100n) / 99n);

    const order = await createNewOrder({
      engineWallet,
      makerAddress: zenUser.userAddress as `0x${string}`,
      // @ts-ignore
      makerAssetAddress: zenUser.preferences.token as `0x${string}`,
      // @ts-ignore
      takerAssetAddress: zenUser.preferences.takerToken as `0x${string}`,
      makingAmount: makingAmount,
      takingAmount: takingAmount,
      expiresIn: 86400n, // 1 day expiration
    });

    return order;
  }

  private async createOrderForUser(
    userAddress: string,
    orderData: CreateNewOrderResponse
  ): Promise<Order> {
    console.log("📝 Creating order for user:", userAddress);

    let orderDetails = orderData.order.build();

    try {
      const order = await prisma.order.create({
        data: {
          userAddress,
          makerToken: orderDetails.makerAsset,
          data: JSON.stringify({
            order: orderDetails,
            signature: orderData.signature,
          }),
          completed: false,
        },
      });

      console.log("✅ Order created:", order.id);
      return order;
    } catch (error) {
      console.error("❌ Failed to create order:", error);
      throw error;
    }
  }

  private async shouldUpdateOrder(order: Order): Promise<boolean> {
    // TODO: Implement logic to determine if order needs updating
    console.log("🔄 Checking if order should be updated:", order.id);
    return false; // Placeholder
  }

  private async calculateOrderUpdate(order: Order) {
    // TODO: Implement order update calculation
    console.log("🔄 Calculating order update for:", order.id);
    return {}; // Placeholder
  }

  private async updateOrder(orderId: string, updateData: any) {
    // TODO: Implement order update logic
    console.log("📝 Updating order:", orderId);

    try {
      const updatedOrder = await prisma.order.update({
        where: { id: orderId },
        data: updateData,
      });

      console.log("✅ Order updated:", updatedOrder.id);
      return updatedOrder;
    } catch (error) {
      console.error("❌ Failed to update order:", error);
      throw error;
    }
  }

  // Deactivate zen mode for a user (updated to use database)
  async deactivateZenMode(userAddress: string) {
    console.log("🛑 Deactivating zen mode for user:", userAddress);

    try {
      // Update user in database
      const zenUser = await prisma.zenModeUser.findUnique({
        where: { userAddress },
      });

      if (zenUser) {
        await prisma.zenModeUser.update({
          where: { userAddress },
          data: { isActive: false },
        });
        console.log("✅ Zen mode deactivated for:", userAddress);
      } else {
        console.log("⚠️ User not found in zen mode:", userAddress);
      }

      // Check if monitoring should stop
      await this.checkAndStopMonitoring();

      return { success: true, userAddress, zenModeActive: false };
    } catch (error) {
      console.error("❌ Failed to deactivate zen mode:", error);
      throw error;
    }
  }
}

// Example usage
async function runEngine() {
  console.log("🚀 Starting Engine...");

  const engine = new Engine();

  try {
    // Example 1: Process some data
    const sampleData = { message: "Hello from engine", timestamp: Date.now() };
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
