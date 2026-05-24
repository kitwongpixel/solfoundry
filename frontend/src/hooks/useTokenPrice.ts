import { useEffect, useMemo, useRef, useState } from 'react';

export interface DexScreenerTokenPair {
  chainId: string;
  dexId: string;
  url: string;
  pairAddress: string;
  baseToken: { address: string; symbol: string; name: string };
  quoteToken: { address: string; symbol: string; name: string };
  priceUsd?: string;
  priceNative?: string;
  priceChange?: { h24?: string };
  liquidity?: { usd?: number | string };
  volume?: { h24?: number | string };
  fdv?: number | string;
}

export interface TokenPriceSnapshot {
  tokenAddress: string;
  symbol: string;
  name: string;
  pairAddress: string;
  pairUrl: string;
  dexId: string;
  quoteSymbol: string;
  priceUsd: number;
  change24h: number;
  liquidityUsd: number;
  fdv: number;
  updatedAt: string;
}

const DEXSCREENER_API = 'https://api.dexscreener.com/latest/dex/tokens';

function asNumber(value: unknown): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function pickBestPair(tokenAddress: string, pairs: DexScreenerTokenPair[]): DexScreenerTokenPair | null {
  const normalized = tokenAddress.toLowerCase();
  const solanaPairs = pairs.filter((pair) => pair.chainId === 'solana' && pair.baseToken?.address?.toLowerCase() === normalized);
  const source = solanaPairs.length > 0 ? solanaPairs : pairs.filter((pair) => pair.baseToken?.address?.toLowerCase() === normalized);

  if (source.length === 0) return null;

  return [...source].sort((a, b) => asNumber(b.liquidity?.usd) - asNumber(a.liquidity?.usd))[0] ?? source[0] ?? null;
}

async function fetchTokenSnapshot(tokenAddress: string): Promise<TokenPriceSnapshot> {
  const response = await fetch(`${DEXSCREENER_API}/${encodeURIComponent(tokenAddress)}`);
  if (!response.ok) {
    throw new Error(response.statusText || 'Failed to load FNDRY price');
  }

  const payload = (await response.json()) as { pairs?: DexScreenerTokenPair[] };
  const pair = pickBestPair(tokenAddress, payload.pairs ?? []);
  if (!pair) {
    throw new Error('No DexScreener pair found for FNDRY');
  }

  const priceUsd = asNumber(pair.priceUsd);
  const change24h = asNumber(pair.priceChange?.h24);
  const liquidityUsd = asNumber(pair.liquidity?.usd);
  const fdv = asNumber(pair.fdv);

  return {
    tokenAddress,
    symbol: pair.baseToken.symbol || 'FNDRY',
    name: pair.baseToken.name || 'FNDRY',
    pairAddress: pair.pairAddress,
    pairUrl: pair.url,
    dexId: pair.dexId,
    quoteSymbol: pair.quoteToken.symbol || 'USDC',
    priceUsd,
    change24h,
    liquidityUsd,
    fdv,
    updatedAt: new Date().toISOString(),
  };
}

export interface UseTokenPriceOptions {
  tokenAddress: string;
  refreshIntervalMs?: number;
  historyLimit?: number;
}

export function useTokenPrice({
  tokenAddress,
  refreshIntervalMs = 30_000,
  historyLimit = 12,
}: UseTokenPriceOptions) {
  const [snapshot, setSnapshot] = useState<TokenPriceSnapshot | null>(null);
  const [history, setHistory] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const load = async () => {
    try {
      const next = await fetchTokenSnapshot(tokenAddress);
      if (!mountedRef.current) return;
      setSnapshot(next);
      setHistory((current) => {
        const nextHistory = [...current, next.priceUsd].filter((value) => Number.isFinite(value));
        return nextHistory.slice(-historyLimit);
      });
      setError(null);
    } catch (err) {
      if (!mountedRef.current) return;
      setError(err instanceof Error ? err.message : 'Failed to load price data');
    } finally {
      if (mountedRef.current) setIsLoading(false);
    }
  };

  useEffect(() => {
    mountedRef.current = true;
    void load();

    const interval = window.setInterval(() => {
      void load();
    }, refreshIntervalMs);

    return () => {
      mountedRef.current = false;
      window.clearInterval(interval);
    };
  }, [historyLimit, refreshIntervalMs, tokenAddress]);

  const stats = useMemo(() => {
    if (!snapshot) return null;
    return {
      priceUsd: snapshot.priceUsd,
      change24h: snapshot.change24h,
      liquidityUsd: snapshot.liquidityUsd,
      fdv: snapshot.fdv,
      quoteSymbol: snapshot.quoteSymbol,
      pairUrl: snapshot.pairUrl,
      pairAddress: snapshot.pairAddress,
      dexId: snapshot.dexId,
      updatedAt: snapshot.updatedAt,
      symbol: snapshot.symbol,
      name: snapshot.name,
    };
  }, [snapshot]);

  return {
    data: stats,
    history,
    isLoading,
    error,
    refresh: load,
  };
}
