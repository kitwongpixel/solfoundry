import React, { useMemo } from 'react';
import { ExternalLink, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { cardHover } from '../../lib/animations';
import { formatCompactValue, formatCurrency, truncateAddress } from '../../lib/utils';
import { useTreasuryDashboard } from '../../hooks/useAdminData';
import type { TreasuryDashboard, TreasuryTransaction } from '../../hooks/useAdminData';

function buildSparkline(values: number[], width = 320, height = 72) {
  if (values.length === 0) return '';
  if (values.length === 1) return `M 0 ${height / 2} L ${width} ${height / 2}`;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const step = width / Math.max(values.length - 1, 1);

  return values
    .map((value, index) => {
      const x = Math.round(index * step);
      const y = Math.round(height - ((value - min) / range) * (height - 10) - 5);
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');
}

function MetricCard({
  id,
  label,
  value,
  hint,
}: {
  id?: string;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div id={id} data-testid={id} className="rounded-xl border border-border bg-forge-950/60 p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-text-muted">{label}</p>
      <p className="mt-2 text-xl font-semibold text-text-primary">{value}</p>
      {hint && <p className="mt-1 text-xs text-text-muted">{hint}</p>}
    </div>
  );
}

function normalizeDashboard(data: TreasuryDashboard | Record<string, unknown>): TreasuryDashboard {
  const burnRate = (data as Record<string, unknown>).burnRate as Record<string, unknown> | undefined;
  const burn_rate = (data as Record<string, unknown>).burn_rate as Record<string, unknown> | undefined;

  const spendingByTier = ((data as Record<string, unknown>).spendingByTier ?? (data as Record<string, unknown>).spending_by_tier ?? []) as Record<string, unknown>[];
  const recentTransactions = ((data as Record<string, unknown>).recentTransactions ?? (data as Record<string, unknown>).recent_transactions ?? []) as Record<string, unknown>[];
  const dailyPoints = ((data as Record<string, unknown>).dailyPoints ?? (data as Record<string, unknown>).daily_points ?? []) as Record<string, unknown>[];

  return {
    solBalance: Number((data as Record<string, unknown>).solBalance ?? (data as Record<string, unknown>).sol_balance ?? 0),
    fndryBalance: Number((data as Record<string, unknown>).fndryBalance ?? (data as Record<string, unknown>).fndry_balance ?? 0),
    treasuryWallet: String((data as Record<string, unknown>).treasuryWallet ?? (data as Record<string, unknown>).treasury_wallet ?? ''),
    totalPaidOutFndry: Number((data as Record<string, unknown>).totalPaidOutFndry ?? (data as Record<string, unknown>).total_paid_out_fndry ?? 0),
    totalPaidOutSol: Number((data as Record<string, unknown>).totalPaidOutSol ?? (data as Record<string, unknown>).total_paid_out_sol ?? 0),
    totalPayouts: Number((data as Record<string, unknown>).totalPayouts ?? (data as Record<string, unknown>).total_payouts ?? 0),
    totalBuybackAmount: Number((data as Record<string, unknown>).totalBuybackAmount ?? (data as Record<string, unknown>).total_buyback_amount ?? 0),
    totalBuybacks: Number((data as Record<string, unknown>).totalBuybacks ?? (data as Record<string, unknown>).total_buybacks ?? 0),
    lastUpdated: String((data as Record<string, unknown>).lastUpdated ?? (data as Record<string, unknown>).last_updated ?? new Date().toISOString()),
    dailyPoints: dailyPoints.map((point) => ({
      date: String(point.date ?? ''),
      outflow: Number(point.outflow ?? 0),
      inflow: Number(point.inflow ?? 0),
    })),
    burnRate: {
      daily_avg_7d: Number(burnRate?.daily_avg_7d ?? burn_rate?.daily_avg_7d ?? 0),
      daily_avg_30d: Number(burnRate?.daily_avg_30d ?? burn_rate?.daily_avg_30d ?? 0),
      daily_avg_90d: Number(burnRate?.daily_avg_90d ?? burn_rate?.daily_avg_90d ?? 0),
      runway_days_7d: Number(burnRate?.runway_days_7d ?? burn_rate?.runway_days_7d ?? 0),
      runway_days_30d: Number(burnRate?.runway_days_30d ?? burn_rate?.runway_days_30d ?? 0),
    },
    spendingByTier: spendingByTier.map((tier) => ({
      tier: Number(tier.tier ?? 0),
      label: String(tier.label ?? `T${tier.tier ?? 0}`),
      total_fndry: Number(tier.total_fndry ?? 0),
      count: Number(tier.count ?? 0),
    })),
    recentTransactions: recentTransactions.map((tx) => ({
      id: String(tx.id ?? ''),
      type: String(tx.type ?? 'other') as TreasuryTransaction['type'],
      amount: Number(tx.amount ?? 0),
      token: String(tx.token ?? 'FNDRY'),
      recipient: tx.recipient == null ? null : String(tx.recipient),
      description: String(tx.description ?? ''),
      tx_hash: tx.tx_hash == null ? null : String(tx.tx_hash),
      solscan_url: tx.solscan_url == null ? null : String(tx.solscan_url),
      status: String(tx.status ?? 'confirmed'),
      created_at: String(tx.created_at ?? new Date().toISOString()),
    })),
  };
}

function downloadCsv(data: TreasuryDashboard) {
  const header = ['id', 'type', 'amount', 'token', 'recipient', 'description', 'tx_hash', 'status', 'created_at'];
  const rows = data.recentTransactions.map((tx) => [
    tx.id,
    tx.type,
    tx.amount,
    tx.token,
    tx.recipient ?? '',
    tx.description.replace(/"/g, '""'),
    tx.tx_hash ?? '',
    tx.status,
    tx.created_at,
  ]);
  const csv = [header.join(','), ...rows.map((row) => row.map((value) => `"${String(value)}"`).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'treasury-transactions.csv';
  link.click();
  URL.revokeObjectURL(link.href);
}

export function TreasuryPanel() {
  const { data, isLoading, isError, refetch } = useTreasuryDashboard();
  const view = useMemo(() => (data ? normalizeDashboard(data) : null), [data]);

  const sparkline = useMemo(
    () => buildSparkline((view?.dailyPoints ?? []).map((point) => point.outflow)),
    [view?.dailyPoints],
  );

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-border bg-forge-900 p-6">
        <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Admin treasury</p>
        <h2 className="mt-1 font-display text-2xl font-semibold text-text-primary">Treasury Dashboard</h2>
        <div className="mt-6 h-40 rounded-2xl bg-forge-800 animate-pulse" />
      </div>
    );
  }

  if (isError || !view) {
    return (
      <div id="treasury-error" data-testid="treasury-error" role="alert" className="rounded-2xl border border-status-error/30 bg-status-error/10 p-6 text-status-error">
        <p className="font-semibold">Treasury dashboard unavailable</p>
        <p className="mt-2 text-sm text-status-error/80">We could not load the treasury dashboard. Try again shortly.</p>
        <button
          type="button"
          onClick={() => void refetch()}
          className="mt-4 inline-flex items-center gap-2 rounded-lg border border-status-error/30 px-3 py-2 text-sm font-medium hover:bg-status-error/10 transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Retry
        </button>
      </div>
    );
  }

  const runway = view.burnRate?.runway_days_7d ?? 0;
  const hasPaidBounties = view.spendingByTier.some((tier) => tier.total_fndry > 0);
  const hasTransactions = view.recentTransactions.length > 0;

  return (
    <motion.section
      variants={cardHover}
      initial="rest"
      whileHover="hover"
      className="rounded-2xl border border-border bg-forge-900 p-6"
      aria-labelledby="treasury-panel-title"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-mono uppercase tracking-[0.2em] text-text-muted">Admin treasury</p>
          <h2 id="treasury-panel-title" className="mt-1 font-display text-2xl font-semibold text-text-primary">
            Treasury Dashboard
          </h2>
        </div>
        <button
          type="button"
          onClick={() => void refetch()}
          className="inline-flex items-center gap-2 rounded-full border border-border bg-forge-850 px-3 py-2 text-xs font-medium text-text-secondary hover:text-text-primary hover:border-border-hover transition-colors duration-150"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </button>
      </div>

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricCard
          id="fndry-balance"
          label="FNDRY Balance"
          value={formatCompactValue(view.fndryBalance)}
          hint="Held in treasury"
        />
        <MetricCard
          id="sol-balance"
          label="SOL Balance"
          value={view.solBalance.toFixed(1)}
          hint="Available for operations"
        />
        <MetricCard
          id="total-payouts"
          label="Total Payouts"
          value={formatCompactValue(view.totalPayouts)}
          hint="Completed bounty payouts"
        />
        <MetricCard
          label="Treasury Wallet"
          value={truncateAddress(view.treasuryWallet, 6)}
          hint="On-chain account"
        />
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-forge-950/60 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Outflow trend</p>
            <p className="mt-1 text-sm text-text-secondary">Recent payout spending from the treasury.</p>
          </div>
          <a
            href={`https://solscan.io/account/${view.treasuryWallet}`}
            target="_blank"
            rel="noreferrer"
            data-testid="treasury-wallet-link"
            className="inline-flex items-center gap-1 text-sm text-emerald hover:text-emerald-light transition-colors"
          >
            View on Solscan
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
          <button
            type="button"
            data-testid="export-csv-btn"
            onClick={() => downloadCsv(view)}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-forge-850 px-3 py-2 text-xs font-medium text-text-secondary hover:text-text-primary hover:border-border-hover transition-colors"
          >
            Export CSV
          </button>
          <button
            type="button"
            data-testid="refresh-btn"
            onClick={() => void refetch()}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-forge-850 px-3 py-2 text-xs font-medium text-text-secondary hover:text-text-primary hover:border-border-hover transition-colors"
          >
            Refresh
          </button>
        </div>

        <svg
          viewBox="0 0 320 72"
          className="mt-4 h-20 w-full"
          preserveAspectRatio="none"
          data-testid="outflow-sparkline"
        >
          <defs>
            <linearGradient id="treasurySparkFill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="rgb(31 204 147)" stopOpacity="0.28" />
              <stop offset="100%" stopColor="rgb(31 204 147)" stopOpacity="0.02" />
            </linearGradient>
          </defs>
          {sparkline && (
            <>
              <path d={`${sparkline} L 320 72 L 0 72 Z`} fill="url(#treasurySparkFill)" />
              <path d={sparkline} fill="none" stroke="rgb(31 204 147)" strokeWidth="2.5" strokeLinecap="round" />
            </>
          )}
        </svg>
      </div>

      <div data-testid="burn-rate-cards" className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          label="7d Avg Burn"
          value={formatCompactValue(view.burnRate.daily_avg_7d)}
          hint={runway > 0 ? `Runway: ${runway.toFixed(0)} days` : 'Runway unavailable'}
        />
        <MetricCard
          label="30d Avg Burn"
          value={formatCompactValue(view.burnRate.daily_avg_30d)}
          hint="Rolling average outflow"
        />
        <MetricCard
          label="90d Avg Burn"
          value={formatCompactValue(view.burnRate.daily_avg_90d)}
          hint="Long-term burn trend"
        />
      </div>

      <div className="mt-6">
        <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Tier spending</p>
        {!hasPaidBounties ? (
          <div className="mt-3 rounded-2xl border border-border bg-forge-950/60 p-4 text-sm text-text-muted">
            No paid bounties yet
          </div>
        ) : (
          <div className="mt-3 space-y-3">
            {view.spendingByTier.map((tier) => {
              const max = Math.max(...view.spendingByTier.map((entry) => entry.total_fndry), 1);
              const width = Math.max((tier.total_fndry / max) * 100, 8);
              return (
                <div key={tier.tier} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-text-secondary">{tier.label}</span>
                    <span className="font-mono text-text-muted">{formatCompactValue(tier.total_fndry)} FNDRY</span>
                  </div>
                  <div className="h-3 rounded-full bg-forge-800 overflow-hidden">
                    <div
                      data-testid={`tier-bar-${tier.tier}`}
                      className="h-full rounded-full bg-gradient-to-r from-emerald to-magenta"
                      style={{ width: `${width}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-6">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Recent transactions</p>
          <span className="text-xs text-text-muted">Last updated {new Date(view.lastUpdated).toLocaleString()}</span>
        </div>

        {!hasTransactions ? (
          <div className="mt-3 rounded-2xl border border-border bg-forge-950/60 p-4 text-sm text-text-muted">
            No transactions yet
          </div>
        ) : (
          <div className="mt-3 overflow-hidden rounded-2xl border border-border bg-forge-950/60">
            <table data-testid="tx-table" className="min-w-full divide-y divide-border">
              <thead className="bg-forge-950/80">
                <tr className="text-left text-xs uppercase tracking-[0.2em] text-text-muted">
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Recipient</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {view.recentTransactions.map((tx) => {
                  const txUrl = tx.solscan_url || (tx.tx_hash ? `https://solscan.io/tx/${tx.tx_hash}` : null);
                  return (
                    <tr key={tx.id} className="text-sm text-text-secondary">
                      <td className="px-4 py-3 font-medium text-text-primary">{tx.type}</td>
                      <td className="px-4 py-3 font-mono">{formatCurrency(tx.amount, tx.token)}</td>
                      <td className="px-4 py-3 font-mono">{tx.recipient ?? '—'}</td>
                      <td className="px-4 py-3">{tx.description}</td>
                      <td className="px-4 py-3 flex items-center gap-3">
                        <span className="capitalize">{tx.status}</span>
                        {txUrl && (
                          <a
                            href={txUrl}
                            target="_blank"
                            rel="noreferrer"
                            data-testid={`tx-explorer-link-${tx.id}`}
                            className="inline-flex items-center gap-1 text-emerald hover:text-emerald-light transition-colors"
                          >
                            Explorer
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </motion.section>
  );
}
