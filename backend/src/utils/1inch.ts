import {
  LimitOrder,
  MakerTraits,
  Address,
  Sdk,
  randBigInt,
  FetchProviderConnector,
  LimitOrderContract,
  LimitOrderV4Struct,
  LimitOrderWithFee,
  TakerTraits,
} from "@1inch/limit-order-sdk";
import { WalletClient } from "viem";
import { PrivateKeyAccount, privateKeyToAccount } from "viem/accounts";
import { base } from "viem/chains";
import { LIMIT_ORDER_PROTOCOL_ADDRESS } from "../constants";
import { AxiosProviderConnector } from "@1inch/limit-order-sdk/axios";

export interface CreateNewOrderParams {
  engineWallet: PrivateKeyAccount;
  makerAddress: `0x${string}`;
  makerAssetAddress: `0x${string}`;
  takerAssetAddress: `0x${string}`;
  makingAmount: bigint;
  takingAmount: bigint;
  expiresIn?: bigint; // Optional expiration time in seconds
  chainId?: number; // Optional chain ID, default to base
}

export interface CreateNewOrderResponse {
  order: LimitOrderWithFee;
  signature: `0x${string}`;
}

export const createNewOrder = async ({
  engineWallet,
  makerAddress,
  makerAssetAddress,
  takerAssetAddress,
  makingAmount,
  takingAmount,
  expiresIn = 120n, // Default to 2 minutes
  chainId = base.id, // Default to Base chain
}: CreateNewOrderParams): Promise<CreateNewOrderResponse> => {
  const oneinchAuthKey = "NUCdZVcpFmtPK6GX6i8tWxkfu8nqUrms";

  const expiration = BigInt(Math.floor(Date.now() / 1000)) + expiresIn;

  const UINT_40_MAX = (1n << 48n) - 1n;

  // see MakerTraits.ts
  const makerTraits = MakerTraits.default()
    .withExpiration(expiration)
    .withNonce(randBigInt(1000000n));

  const sdk = new Sdk({
    authKey: oneinchAuthKey,
    networkId: chainId,
    httpConnector: new FetchProviderConnector(),
  });

  console.log("Creating order with parameters:", {
    makerAssetAddress,
    takerAssetAddress,
    makingAmount: makingAmount.toString(),
    takingAmount: takingAmount.toString(),
    makerAddress,
    expiration: expiration.toString(),
    chainId,
  });

  const order = await sdk.createOrder(
    {
      makerAsset: new Address(makerAssetAddress),
      takerAsset: new Address(takerAssetAddress),
      makingAmount: makingAmount,
      takingAmount: takingAmount,
      maker: new Address(makerAddress),
    },
    makerTraits
  );

  const typedData = order.getTypedData(chainId);
  const signature = await engineWallet.signTypedData(typedData);

  return {
    order,
    signature: signature as `0x${string}`,
  };
};

export interface FillContractOrderParams {
  takerWallet: WalletClient;
  order: LimitOrderV4Struct;
  signature: `0x${string}`;
  chainId?: number;
}

export const fillContractOrder = async ({
  takerWallet,
  order,
  signature,
  chainId = base.id,
}: FillContractOrderParams) => {
  if (!takerWallet.account)
    throw new Error("Taker wallet account is not connected");
  const oneinchAuthKey = "NUCdZVcpFmtPK6GX6i8tWxkfu8nqUrms";

  const takerTraits = TakerTraits.default();

  const sdk = new Sdk({
    authKey: oneinchAuthKey,
    networkId: chainId,
    httpConnector: new FetchProviderConnector(),
  });

  const data = LimitOrderContract.getFillContractOrderCalldata(
    order,
    signature,
    takerTraits,
    BigInt(order.makingAmount)
  );

  const tx = await takerWallet.sendTransaction({
    chain: base,
    account: takerWallet.account,
    to: LIMIT_ORDER_PROTOCOL_ADDRESS,
    data: data as `0x${string}`,
  });

  return tx;
};
