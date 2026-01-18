import { DEFAULT_CONFIG, POLYGON_USDC_ADDRESS } from '../constants/polymarket.constants';

export type RuntimeEnv = {
  targetAddresses: string[];
  proxyWallet: string;
  privateKey: string;
  mongoUri?: string;
  rpcUrl: string;
  fetchIntervalSeconds: number;
  tradeMultiplier: number;
  retryLimit: number;
  aggregationEnabled: boolean;
  aggregationWindowSeconds: number;
  usdcContractAddress: string;
  polymarketApiKey?: string;
  polymarketApiSecret?: string;
  polymarketApiPassphrase?: string;
  minTradeSizeUsd?: number; // Minimum trade size to frontrun (USD)
  frontrunSizeMultiplier?: number; // Frontrun size as percentage of target trade (0.0-1.0)
  gasPriceMultiplier?: number; // Gas price multiplier for frontrunning (e.g., 1.2 = 20% higher)
  tradeExecutionEnabled?: boolean; // Enable/disable trade execution (monitoring only mode)
};

/**
 * 验证以太坊地址格式
 */
function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * 验证私钥格式（64字符十六进制，可选0x前缀）
 */
function isValidPrivateKey(key: string): boolean {
  const cleaned = key.startsWith('0x') ? key.slice(2) : key;
  return /^[a-fA-F0-9]{64}$/.test(cleaned);
}

/**
 * 验证 RPC URL 格式
 */
function isValidRpcUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:', 'wss:', 'ws:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

/**
 * 验证数值范围
 */
function validateNumber(value: number, min: number, max: number, name: string): void {
  if (isNaN(value) || value < min || value > max) {
    throw new Error(`${name} must be between ${min} and ${max}, got ${value}`);
  }
}

export function loadEnv(): RuntimeEnv {
  const parseList = (val: string | undefined): string[] => {
    if (!val) return [];
    try {
      const maybeJson = JSON.parse(val);
      if (Array.isArray(maybeJson)) return maybeJson.map(String);
    } catch (_) {
      // not JSON, parse as comma separated
    }
    return val
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  };

  const required = (name: string, v: string | undefined): string => {
    if (!v) throw new Error(`Missing required env var: ${name}`);
    return v;
  };

  const targetAddresses = parseList(process.env.TARGET_ADDRESSES);
  if (targetAddresses.length === 0) {
    throw new Error('TARGET_ADDRESSES must contain at least one trader address');
  }

  // 验证目标地址格式
  for (const addr of targetAddresses) {
    if (!isValidAddress(addr)) {
      throw new Error(`Invalid target address format: ${addr}`);
    }
  }

  const proxyWallet = required('PUBLIC_KEY', process.env.PUBLIC_KEY);
  if (!isValidAddress(proxyWallet)) {
    throw new Error(`Invalid PUBLIC_KEY address format: ${proxyWallet}`);
  }

  const privateKey = required('PRIVATE_KEY', process.env.PRIVATE_KEY);
  if (!isValidPrivateKey(privateKey)) {
    throw new Error('Invalid PRIVATE_KEY format. Must be 64-character hex string (with or without 0x prefix)');
  }

  const rpcUrl = required('RPC_URL', process.env.RPC_URL);
  if (!isValidRpcUrl(rpcUrl)) {
    throw new Error(`Invalid RPC_URL format: ${rpcUrl}`);
  }

  const fetchIntervalSeconds = Number(process.env.FETCH_INTERVAL ?? DEFAULT_CONFIG.FETCH_INTERVAL_SECONDS);
  validateNumber(fetchIntervalSeconds, 0.1, 60, 'FETCH_INTERVAL');

  const tradeMultiplier = Number(process.env.TRADE_MULTIPLIER ?? DEFAULT_CONFIG.TRADE_MULTIPLIER);
  validateNumber(tradeMultiplier, 0.1, 10, 'TRADE_MULTIPLIER');

  const retryLimit = Number(process.env.RETRY_LIMIT ?? DEFAULT_CONFIG.RETRY_LIMIT);
  validateNumber(retryLimit, 1, 10, 'RETRY_LIMIT');

  const aggregationWindowSeconds = Number(process.env.TRADE_AGGREGATION_WINDOW_SECONDS ?? DEFAULT_CONFIG.AGGREGATION_WINDOW_SECONDS);
  validateNumber(aggregationWindowSeconds, 1, 3600, 'TRADE_AGGREGATION_WINDOW_SECONDS');

  const minTradeSizeUsd = Number(process.env.MIN_TRADE_SIZE_USD ?? DEFAULT_CONFIG.MIN_TRADE_SIZE_USD);
  validateNumber(minTradeSizeUsd, 0, 1000000, 'MIN_TRADE_SIZE_USD');

  const frontrunSizeMultiplier = Number(process.env.FRONTRUN_SIZE_MULTIPLIER ?? DEFAULT_CONFIG.FRONTRUN_SIZE_MULTIPLIER);
  validateNumber(frontrunSizeMultiplier, 0, 1, 'FRONTRUN_SIZE_MULTIPLIER');

  const gasPriceMultiplier = Number(process.env.GAS_PRICE_MULTIPLIER ?? DEFAULT_CONFIG.GAS_PRICE_MULTIPLIER);
  validateNumber(gasPriceMultiplier, 1, 5, 'GAS_PRICE_MULTIPLIER');

  const tradeExecutionEnabled = String(process.env.TRADE_EXECUTION_ENABLED ?? 'true') === 'true';

  const usdcContractAddress = process.env.USDC_CONTRACT_ADDRESS || POLYGON_USDC_ADDRESS;
  if (!isValidAddress(usdcContractAddress)) {
    throw new Error(`Invalid USDC_CONTRACT_ADDRESS format: ${usdcContractAddress}`);
  }

  const env: RuntimeEnv = {
    targetAddresses,
    proxyWallet,
    privateKey,
    mongoUri: process.env.MONGO_URI,
    rpcUrl,
    fetchIntervalSeconds,
    tradeMultiplier,
    retryLimit,
    aggregationEnabled: String(process.env.TRADE_AGGREGATION_ENABLED ?? 'false') === 'true',
    aggregationWindowSeconds,
    usdcContractAddress,
    polymarketApiKey: process.env.POLYMARKET_API_KEY,
    polymarketApiSecret: process.env.POLYMARKET_API_SECRET,
    polymarketApiPassphrase: process.env.POLYMARKET_API_PASSPHRASE,
    minTradeSizeUsd,
    frontrunSizeMultiplier,
    gasPriceMultiplier,
    tradeExecutionEnabled,
  };

  return env;
}

