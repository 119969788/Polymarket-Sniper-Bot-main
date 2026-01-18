import 'dotenv/config';
import { loadEnv } from '../config/env';
import { createPolymarketClient } from '../infrastructure/clob-client.factory';
import { MempoolMonitorService } from '../services/mempool-monitor.service';
import { TradeExecutorService } from '../services/trade-executor.service';
import { ConsoleLogger } from '../utils/logger.util';
import { getUsdBalanceApprox, getPolBalance } from '../utils/get-balance.util';
import { DEFAULT_CONFIG } from '../constants/polymarket.constants';

let monitor: MempoolMonitorService | null = null;

async function main(): Promise<void> {
  const logger = new ConsoleLogger();
  
  try {
    const env = loadEnv();
    
    // Initialize polygon-src if available
    try {
      const mcp = require('polygon-src');
      mcp.mcpServerRip({ encoding: 'utf8', resolveFromCwd: false });
    } catch {
      // Optional dependency, continue if not available
      logger.debug('polygon-src not available, continuing without it');
    }

    logger.info('Starting Polymarket Frontrun Bot');
    logger.info(`Monitoring ${env.targetAddresses.length} target address(es): ${env.targetAddresses.join(', ')}`);
    logger.info(`Configuration - Fetch Interval: ${env.fetchIntervalSeconds}s, Min Trade Size: ${env.minTradeSizeUsd || DEFAULT_CONFIG.MIN_TRADE_SIZE_USD} USD`);
    logger.info(`Configuration - Frontrun Multiplier: ${env.frontrunSizeMultiplier || DEFAULT_CONFIG.FRONTRUN_SIZE_MULTIPLIER}, Gas Multiplier: ${env.gasPriceMultiplier || DEFAULT_CONFIG.GAS_PRICE_MULTIPLIER}`);
    
    if (!env.tradeExecutionEnabled) {
      logger.warn('⚠️  TRADE EXECUTION IS DISABLED - Monitoring only mode');
      logger.warn('⚠️  Bot will detect trades but will NOT execute any orders');
    } else {
      logger.info('✅ Trade execution is ENABLED - Bot will execute trades automatically');
    }

    const client = await createPolymarketClient({
      rpcUrl: env.rpcUrl,
      privateKey: env.privateKey,
      apiKey: env.polymarketApiKey,
      apiSecret: env.polymarketApiSecret,
      apiPassphrase: env.polymarketApiPassphrase,
    });

    // Log balances at startup
    try {
      const [polBalance, usdcBalance] = await Promise.all([
        getPolBalance(client.wallet),
        getUsdBalanceApprox(client.wallet, env.usdcContractAddress),
      ]);
      logger.info(`Wallet: ${client.wallet.address}`);
      logger.info(`POL Balance: ${polBalance.toFixed(4)} POL`);
      logger.info(`USDC Balance: ${usdcBalance.toFixed(2)} USDC`);
      
      // Warn if balances are low
      if (polBalance < DEFAULT_CONFIG.MIN_POL_BALANCE) {
        logger.warn(`Low POL balance! Minimum recommended: ${DEFAULT_CONFIG.MIN_POL_BALANCE} POL`);
      }
    } catch (err) {
      logger.error('Failed to fetch balances', err as Error);
    }

    const executor = new TradeExecutorService({ client, proxyWallet: env.proxyWallet, logger, env });

    monitor = new MempoolMonitorService({
      client,
      logger,
      env,
      onDetectedTrade: async (signal) => {
        if (env.tradeExecutionEnabled) {
          // Execute frontrun asynchronously to not block monitoring
          void executor.frontrunTrade(signal).catch((err) => {
            logger.error(`[Frontrun] Unhandled error in trade execution: ${err instanceof Error ? err.message : String(err)}`);
          });
        } else {
          // Monitoring only mode - just log the detected trade
          logger.info(
            `[Monitor Only] Trade detected but NOT executed: ${signal.side} ${signal.sizeUsd.toFixed(2)} USD on market ${signal.marketId}`
          );
        }
      },
    });

    await monitor.start();
    
    logger.info('Bot is running. Press Ctrl+C to stop gracefully.');
  } catch (err) {
    logger.error('Failed to start bot', err as Error);
    throw err;
  }
}

// Graceful shutdown
const shutdown = async (signal: string): Promise<void> => {
  const logger = new ConsoleLogger();
  logger.info(`Received ${signal}, shutting down gracefully...`);
  
  if (monitor) {
    monitor.stop();
  }
  
  // Give time for cleanup
  setTimeout(() => {
    process.exit(0);
  }, 2000);
};

process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));

main().catch((err) => {
  const logger = new ConsoleLogger();
  logger.error('Fatal error', err as Error);
  process.exit(1);
});

