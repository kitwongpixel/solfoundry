import React from 'react';
import { motion } from 'framer-motion';
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
} from 'recharts';
import { Loader2 } from 'lucide-react';
import { fadeIn } from '../../lib/animations';
import { formatCurrency } from '../../lib/utils';
import { buildEarningsHistory, type ProfileBountySource, type EarningsPoint } from '../../lib/profile';

interface EarningsHistoryChartProps {
  walletAddress?: string | null;
  bounties: ProfileBountySource[];
  fallbackTotal: number;
  loading?: boolean;
}

function EmptyState({ walletAddress }: { walletAddress?: string | null }) {
  return (
    <div className="rounded-lg border border-border bg-forge-950 px-4 py-6 text-sm text-text-muted">
      {walletAddress
        ? 'No FNDRY payouts have been recorded for this wallet yet.'
        : 'Link a wallet to visualize FNDRY payouts over time.'}
    </div>
  );
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value?: number; payload?: EarningsPoint }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const point = payload[0]?.payload;
  if (!point) return null;

  return (
    <div className="rounded-lg border border-border bg-forge-950 px-3 py-2 shadow-lg">
      <p className="text-xs text-text-muted mb-1">{label}</p>
      <p className="font-mono text-sm text-emerald">{formatCurrency(point.amount, 'FNDRY')}</p>
      <p className="text-xs text-text-muted">{point.payouts} payout{point.payouts === 1 ? '' : 's'}</p>
    </div>
  );
}

export function EarningsHistoryChart({
  walletAddress,
  bounties,
  fallbackTotal,
  loading = false,
}: EarningsHistoryChartProps) {
  const history = buildEarningsHistory(bounties, walletAddress);
  const total = history.reduce((sum, point) => sum + point.amount, 0) || fallbackTotal;

  return (
    <motion.section
      variants={fadeIn}
      initial="initial"
      animate="animate"
      className="rounded-xl border border-border bg-forge-900 p-5"
      aria-label="Earnings history chart"
    >
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-text-muted mb-1">Earnings history</p>
          <h2 className="font-sans text-lg font-semibold text-text-primary">FNDRY payouts over time</h2>
        </div>
        <div className="text-right">
          <p className="text-xs text-text-muted">Total earned</p>
          <p className="font-mono text-lg font-semibold text-emerald">{formatCurrency(total, 'FNDRY')}</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[260px] text-text-muted">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
          Loading earnings history...
        </div>
      ) : history.length === 0 ? (
        <EmptyState walletAddress={walletAddress} />
      ) : (
        <div className="space-y-3">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={history} margin={{ top: 8, right: 0, left: -12, bottom: 0 }}>
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#8A8AA3', fontSize: 12, fontFamily: 'JetBrains Mono' }}
              />
              <YAxis hide />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(20, 241, 149, 0.08)' }} />
              <Bar dataKey="amount" radius={[8, 8, 0, 0]} fill="#14F195">
                {history.map((entry) => (
                  <Cell key={entry.month} fill={entry.amount > 0 ? '#14F195' : '#4B5563'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          <div className="flex flex-wrap gap-3 text-xs text-text-muted">
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald" />
              Paid in FNDRY only
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-forge-600" />
              {history.reduce((sum, point) => sum + point.payouts, 0)} payout{history.reduce((sum, point) => sum + point.payouts, 0) === 1 ? '' : 's'}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-status-info" />
              {history.length} active month{history.length === 1 ? '' : 's'}
            </span>
          </div>

          <p className="text-xs text-text-muted">
            Timeline is built from completed bounties paid to the linked wallet.
          </p>
        </div>
      )}
    </motion.section>
  );
}
