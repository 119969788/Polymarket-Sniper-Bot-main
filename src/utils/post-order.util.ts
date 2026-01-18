import type { ClobClient } from '@polymarket/clob-client';
import { OrderType, Side } from '@polymarket/clob-client';
import { ORDER_EXECUTION } from '../constants/polymarket.constants';

export type OrderSide = 'BUY' | 'SELL';
export type OrderOutcome = 'YES' | 'NO';

export type PostOrderInput = {
  client: ClobClient;
  marketId?: string;
  tokenId: string;
  outcome: OrderOutcome;
  side: OrderSide;
  sizeUsd: number;
  maxAcceptablePrice?: number;
  priority?: boolean; // For frontrunning - execute with higher priority
  targetGasPrice?: string; // Gas price of target transaction for frontrunning
};

export async function postOrder(input: PostOrderInput): Promise<void> {
  const { client, marketId, tokenId, outcome, side, sizeUsd, maxAcceptablePrice } = input;

  // Optional: validate market exists if marketId provided
  if (marketId) {
    try {
      const market = await client.getMarket(marketId);
      if (!market) {
        throw new Error(`Market not found: ${marketId}`);
      }
      // Log market info if DEBUG is enabled
      if (process.env.DEBUG === '1' || process.env.VERBOSE === '1') {
        console.log(`[PostOrder] Market validated: ${marketId}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Market validation failed: ${errorMessage}`);
    }
  }

  let orderBook;
  try {
    orderBook = await client.getOrderBook(tokenId);
    if (process.env.DEBUG === '1' || process.env.VERBOSE === '1') {
      const levels = side === 'BUY' ? orderBook.asks : orderBook.bids;
      console.log(`[PostOrder] Orderbook fetched for ${tokenId}: ${levels?.length || 0} ${side === 'BUY' ? 'asks' : 'bids'}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes('No orderbook exists') || errorMessage.includes('404')) {
      throw new Error(`Market ${marketId} is closed or resolved - no orderbook available for token ${tokenId}`);
    }
    throw error;
  }

  if (!orderBook) {
    throw new Error(`Failed to fetch orderbook for token ${tokenId}`);
  }

  const isBuy = side === 'BUY';
  const levels = isBuy ? orderBook.asks : orderBook.bids;

  if (!levels || levels.length === 0) {
    throw new Error(`No ${isBuy ? 'asks' : 'bids'} available for token ${tokenId} - market may be closed or have no liquidity`);
  }

  const bestPrice = parseFloat(levels[0].price);
  if (maxAcceptablePrice && ((isBuy && bestPrice > maxAcceptablePrice) || (!isBuy && bestPrice < maxAcceptablePrice))) {
    throw new Error(`Price protection: best price ${bestPrice} exceeds max acceptable ${maxAcceptablePrice}`);
  }

  const orderSide = isBuy ? Side.BUY : Side.SELL;
  let remaining = sizeUsd;
  let retryCount = 0;
  const maxRetries = ORDER_EXECUTION.MAX_RETRIES;
  let lastOrderBook: typeof orderBook | null = orderBook; // Reuse initial orderbook

  while (remaining > ORDER_EXECUTION.MIN_REMAINING_USD && retryCount < maxRetries) {
    // Only fetch new orderbook if previous order failed or we need fresh data
    if (retryCount > 0 || lastOrderBook === null) {
      try {
        lastOrderBook = await client.getOrderBook(tokenId);
      } catch (error) {
        retryCount++;
        if (retryCount >= maxRetries) {
          throw error;
        }
        // Exponential backoff for retries
        await new Promise((resolve) => setTimeout(resolve, Math.min(1000 * Math.pow(2, retryCount), 5000)));
        continue;
      }
    }

    const currentLevels = isBuy ? lastOrderBook.asks : lastOrderBook.bids;

    if (!currentLevels || currentLevels.length === 0) {
      break;
    }

    const level = currentLevels[0];
    const levelPrice = parseFloat(level.price);
    const levelSize = parseFloat(level.size);

    // Validate price and size
    if (isNaN(levelPrice) || isNaN(levelSize) || levelPrice <= 0 || levelSize <= 0) {
      retryCount++;
      lastOrderBook = null; // Force refresh on next iteration
      continue;
    }

    // Calculate order size (same logic for both buy and sell)
    const levelValue = levelSize * levelPrice;
    const orderValue = Math.min(remaining, levelValue);
    const orderSize = orderValue / levelPrice;

    // Validate order size
    if (orderSize <= 0 || orderValue <= 0) {
      break;
    }

    const orderArgs = {
      side: orderSide,
      tokenID: tokenId,
      amount: orderSize,
      price: levelPrice,
    };

    try {
      const signedOrder = await client.createMarketOrder(orderArgs);
      const response = await client.postOrder(signedOrder, OrderType.FOK);

      if (response.success) {
        remaining -= orderValue;
        retryCount = 0;
        lastOrderBook = null; // Invalidate cache after successful order
      } else {
        retryCount++;
        lastOrderBook = null; // Force refresh on failure
      }
    } catch (error) {
      retryCount++;
      lastOrderBook = null; // Force refresh on error
      
      // Check if error is retryable
      const errorMessage = error instanceof Error ? error.message : String(error);
      const isRetryable = !errorMessage.includes('closed') && 
                         !errorMessage.includes('resolved') &&
                         !errorMessage.includes('insufficient');
      
      if (!isRetryable || retryCount >= maxRetries) {
        throw error;
      }
      
      // Exponential backoff
      await new Promise((resolve) => setTimeout(resolve, Math.min(1000 * Math.pow(2, retryCount), 5000)));
    }
  }
}

