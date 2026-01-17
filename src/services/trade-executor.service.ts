import type { ClobClient } from '@polymarket/clob-client';
import type { Wallet } from 'ethers';
import type { RuntimeEnv } from '../config/env';
import type { Logger } from '../utils/logger.util';
import type { TradeSignal } from '../domain/trade.types';
import { postOrder } from '../utils/post-order.util';
import { getUsdBalanceApprox, getPolBalance } from '../utils/get-balance.util';
import { httpGet } from '../utils/fetch-data.util';
import { POLYMARKET_API, DEFAULT_CONFIG } from '../constants/polymarket.constants';

export type TradeExecutorDeps = {
  client: ClobClient & { wallet: Wallet };
  proxyWallet: string;
  env: RuntimeEnv;
  logger: Logger;
};

interface Position {
  conditionId: string;
  initialValue: number;
  currentValue: number;
}

/**
 * Balance cache to reduce redundant RPC calls
 */
class BalanceCache {
  private usdcBalance: number | null = null;
  private polBalance: number | null = null;
  private lastUpdate: number = 0;
  private readonly ttl: number; // Time to live in milliseconds

  constructor(ttl: number = 5000) {
    this.ttl = ttl;
  }

  async getUsdcBalance(
    wallet: Wallet,
    usdcContractAddress: string,
    getter: (wallet: Wallet, address: string) => Promise<number>,
  ): Promise<number> {
    const now = Date.now();
    if (this.usdcBalance === null || now - this.lastUpdate > this.ttl) {
      this.usdcBalance = await getter(wallet, usdcContractAddress);
      this.lastUpdate = now;
    }
    return this.usdcBalance;
  }

  async getPolBalance(
    wallet: Wallet,
    getter: (wallet: Wallet) => Promise<number>,
  ): Promise<number> {
    const now = Date.now();
    if (this.polBalance === null || now - this.lastUpdate > this.ttl) {
      this.polBalance = await getter(wallet);
      this.lastUpdate = now;
    }
    return this.polBalance;
  }

  invalidate(): void {
    this.usdcBalance = null;
    this.polBalance = null;
    this.lastUpdate = 0;
  }
}

export class TradeExecutorService {
  private readonly deps: TradeExecutorDeps;
  private readonly balanceCache: BalanceCache;
  private readonly activeTrades: Set<string> = new Set(); // Track active trades to prevent duplicates

  constructor(deps: TradeExecutorDeps) {
    this.deps = deps;
    this.balanceCache = new BalanceCache(5000); // Cache balances for 5 seconds
  }

  async frontrunTrade(signal: TradeSignal): Promise<void> {
    const { logger, env, client } = this.deps;
    
    // Create unique trade identifier to prevent duplicate executions
    const tradeId = `${signal.tokenId}-${signal.side}-${signal.timestamp}`;
    if (this.activeTrades.has(tradeId)) {
      logger.debug(`[Frontrun] Trade ${tradeId} already in progress, skipping`);
      return;
    }

    this.activeTrades.add(tradeId);

    try {
      // Use cached balances to reduce RPC calls
      const [yourUsdBalance, polBalance] = await Promise.all([
        this.balanceCache.getUsdcBalance(client.wallet, env.usdcContractAddress, getUsdBalanceApprox),
        this.balanceCache.getPolBalance(client.wallet, getPolBalance),
      ]);

      logger.info(`[Frontrun] Balance check - POL: ${polBalance.toFixed(4)} POL, USDC: ${yourUsdBalance.toFixed(2)} USDC`);

      // For frontrunning, we execute the same trade but with higher priority
      // Calculate frontrun size (typically smaller or same as target)
      const frontrunSize = this.calculateFrontrunSize(signal.sizeUsd, env);

      logger.info(
        `[Frontrun] Executing ${signal.side} ${frontrunSize.toFixed(2)} USD (target: ${signal.sizeUsd.toFixed(2)} USD)`,
      );

      // Balance validation
      const requiredUsdc = frontrunSize;
      const minPolForGas = DEFAULT_CONFIG.MIN_POL_BALANCE;

      if (signal.side === 'BUY') {
        if (yourUsdBalance < requiredUsdc) {
          logger.error(
            `[Frontrun] Insufficient USDC balance. Required: ${requiredUsdc.toFixed(2)} USDC, Available: ${yourUsdBalance.toFixed(2)} USDC`,
          );
          return;
        }
      }

      if (polBalance < minPolForGas) {
        logger.error(
          `[Frontrun] Insufficient POL balance for gas. Required: ${minPolForGas} POL, Available: ${polBalance.toFixed(4)} POL`,
        );
        return;
      }

      // Execute frontrun order with priority
      // The postOrder function will use higher gas prices if configured
      await postOrder({
        client,
        marketId: signal.marketId,
        tokenId: signal.tokenId,
        outcome: signal.outcome,
        side: signal.side,
        sizeUsd: frontrunSize,
        priority: true, // Flag for priority execution
        targetGasPrice: signal.targetGasPrice,
      });
      
      // Invalidate cache after successful trade
      this.balanceCache.invalidate();
      
      logger.info(`[Frontrun] Successfully executed ${signal.side} order for ${frontrunSize.toFixed(2)} USD`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      if (errorMessage.includes('closed') || errorMessage.includes('resolved') || errorMessage.includes('No orderbook')) {
        logger.warn(`[Frontrun] Skipping trade - Market ${signal.marketId} is closed or resolved: ${errorMessage}`);
      } else {
        logger.error(`[Frontrun] Failed to frontrun trade: ${errorMessage}`, err as Error);
      }
    } finally {
      // Remove from active trades after a delay to allow for retries
      setTimeout(() => {
        this.activeTrades.delete(tradeId);
      }, 30000); // Remove after 30 seconds
    }
  }

  private calculateFrontrunSize(targetSize: number, env: RuntimeEnv): number {
    // Frontrun with a percentage of the target size
    // This can be configured via env variable
    const frontrunMultiplier = env.frontrunSizeMultiplier || DEFAULT_CONFIG.FRONTRUN_SIZE_MULTIPLIER;
    return targetSize * frontrunMultiplier;
  }

  // Keep copyTrade for backward compatibility, but redirect to frontrun
  async copyTrade(signal: TradeSignal): Promise<void> {
    return this.frontrunTrade(signal);
  }

  private async getTraderBalance(trader: string): Promise<number> {
    try {
      const positions: Position[] = await httpGet<Position[]>(
        POLYMARKET_API.POSITIONS_ENDPOINT(trader),
      );
      const totalValue = positions.reduce((sum, pos) => sum + (pos.currentValue || pos.initialValue || 0), 0);
      return Math.max(100, totalValue);
    } catch {
      return 1000;
    }
  }
}


