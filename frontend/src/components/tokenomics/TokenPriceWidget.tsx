import React, { useMemo } from 'react';
import { ExternalLink, RefreshCw, TrendingDown, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTokenPrice } from '../../hooks/useTokenPrice';
import { formatCurrency, formatPercentChange, formatUsdPrice, timeAgo, truncateAddress } from '../../lib/utils';
import { cardHover, fadeIn } from '../../lib/animations';

const FNDRY_TOKEN_MINT = 'C2TvY8E8B75EF2UP8cTpTp3EDUjTgjWmpaGnT74VBAGS';

function buildSparkline(values: number[], width = 320, height = 96) {
  if (values.length === 0) return '';
  if (values.length === 1) return `M 0 ${height / 2} L ${width} ${height / 2}`;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const step = width / Math.max(values.length - 1, 1);

  return values
    .map((value, index) => {
      const x = Math.round(index * step);
      const y = Math.round(height - ((value - min) / range) * (height - 12) - 6);
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');
}

export interface TokenPriceWidgetProps {
  tokenAddress?: string;
  className?: string;
  compact?: boolean;
}

export function TokenPriceWidget({
  tokenAddress = FNDRY_TOKEN_MINT,
  className = '',
  compact = false,
}: TokenPriceWidgetProps) {
  const { data, history, isLoading, error, refresh } = useTokenPrice({ tokenAddress });

  const sparkline = useMemo(() => buildSparkline(history), [history]);
  const positive = (data?.change24h ?? 0) >= 0;

  return (
    <motion.section
      variants={cardHover}
      initial="rest"
      whileHover="hover"
      className={`rounded-2xl border border-border bg-forge-900/95 backdrop-blur-sm overflow-hidden ${className}`}
      aria-labelledby="fndry-price-title"
    >
      <div className="flex items-start justify-between gap-3 px-5 pt-5">
        <div>
          <p className="text-xs font-mono uppercase tracking-[0.2em] text-text-muted">Live market price</p>
          <h2 id="fndry-price-title" className="mt-1 font-display text-xl font-semibold text-text-primary">
            FNDRY Price Widget
          </h2>
          <p className="mt-1 text-sm text-text-secondary">
            Real-time price sourced from DexScreener and refreshed every 30 seconds.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void refresh()}
          className="inline-flex items-center gap-2 rounded-full border border-border bg-forge-850 px-3 py-2 text-xs font-medium text-text-secondary hover:text-text-primary hover:border-border-hover transition-colors duration-150"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </button>
      </div>

      {isLoading && (
        <div aria-live="polite" className="px-5 py-8">
          <div className="h-4 w-32 rounded-full bg-forge-800 animate-pulse" />
          <div className="mt-4 h-14 rounded-xl bg-forge-800 animate-pulse" />
          <div className="mt-4 h-24 rounded-xl bg-forge-800 animate-pulse" />
        </div>
      )}

      {!isLoading && error && !data && (
        <div className="px-5 py-8 text-sm text-status-error">
          Could not load FNDRY price data: {error}
        </div>
      )}

      {data && (
        <motion.div
          variants={fadeIn}
          initial="initial"
          animate="animate"
          className={`${compact ? 'px-4 pb-4 pt-4' : 'px-5 pb-5 pt-4'}`}
        >
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-3xl font-semibold text-text-primary">
                  {formatUsdPrice(data.priceUsd)}
                </span>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                    positive ? 'bg-emerald-bg text-emerald' : 'bg-status-error/10 text-status-error'
                  }`}
                >
                  {positive ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                  {formatPercentChange(data.change24h)}
                </span>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-text-muted">
                <span>{data.symbol} / {data.quoteSymbol}</span>
                <span>Liquidity {formatCurrency(data.liquidityUsd, 'USD')}</span>
                <span>FDV {formatCurrency(data.fdv, 'USD')}</span>
              </div>
            </div>

            <div className="text-right">
              <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Last updated</p>
              <p className="font-mono text-sm text-text-secondary">{timeAgo(data.updatedAt)}</p>
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-border bg-forge-950/70 p-4">
            <svg
              viewBox="0 0 320 96"
              role="img"
              aria-label="FNDRY price trend"
              className="h-24 w-full"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="fndrySparklineFill" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="rgb(31 204 147)" stopOpacity="0.24" />
                  <stop offset="100%" stopColor="rgb(31 204 147)" stopOpacity="0.02" />
                </linearGradient>
              </defs>
              {sparkline && (
                <>
                  <path
                    d={`${sparkline} L 320 96 L 0 96 Z`}
                    fill="url(#fndrySparklineFill)"
                    stroke="none"
                  />
                  <path
                    d={sparkline}
                    fill="none"
                    stroke="rgb(31, 204, 147)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </>
              )}
            </svg>

            <div className="mt-3 flex items-center justify-between text-xs text-text-muted">
              <span className="inline-flex items-center gap-1">
                {data.dexId.toUpperCase()}
                <span className="text-text-muted/70">•</span>
                {truncateAddress(data.pairAddress, 4)}
              </span>
              <a
                href={data.pairUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-emerald hover:text-emerald-light transition-colors"
              >
                Open pair
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <Stat label="Contract" value={truncateAddress(tokenAddress, 6)} />
            <Stat label="History" value={`${history.length} points`} />
          </div>
        </motion.div>
      )}
    </motion.section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-forge-950/50 px-4 py-3">
      <p className="text-xs uppercase tracking-[0.2em] text-text-muted">{label}</p>
      <p className="mt-1 font-mono text-sm text-text-primary break-all">{value}</p>
    </div>
  );
}
