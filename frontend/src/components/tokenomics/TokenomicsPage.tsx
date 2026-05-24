import React, { useEffect, useMemo, useState } from 'react';
import { Coins, Flame, Landmark, PiggyBank, ReceiptText, Wallet } from 'lucide-react';
import { TokenPriceWidget } from './TokenPriceWidget';
import { MOCK_TOKENOMICS, MOCK_TREASURY } from '../../data/mockTokenomics';
import type { TokenomicsData, TreasuryData } from '../../types/tokenomics';
import { formatCompactValue, truncateAddress } from '../../lib/utils';

type LoadingState = 'loading' | 'ready';

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(body || response.statusText || 'Request failed');
  }
  return response.json() as Promise<T>;
}

function normalizeTokenomics(data: Record<string, unknown>): TokenomicsData {
  const breakdown = (data.distributionBreakdown ?? data.distribution_breakdown ?? {}) as Record<string, unknown>;
  const bounties = Number(breakdown.bounties);
  const treasury = Number(breakdown.treasury);
  const liquidity = Number(breakdown.liquidity);
  const community = Number(breakdown.community);

  return {
    tokenName: String(data.tokenName ?? data.token_name ?? 'FNDRY'),
    tokenCA: String(data.tokenCA ?? data.token_ca ?? MOCK_TOKENOMICS.tokenCA),
    totalSupply: Number(data.totalSupply ?? data.total_supply ?? MOCK_TOKENOMICS.totalSupply),
    circulatingSupply: Number(data.circulatingSupply ?? data.circulating_supply ?? MOCK_TOKENOMICS.circulatingSupply),
    treasuryHoldings: Number(data.treasuryHoldings ?? data.treasury_holdings ?? MOCK_TOKENOMICS.treasuryHoldings),
    totalDistributed: Number(data.totalDistributed ?? data.total_distributed ?? MOCK_TOKENOMICS.totalDistributed),
    totalBuybacks: Number(data.totalBuybacks ?? data.total_buybacks ?? MOCK_TOKENOMICS.totalBuybacks),
    totalBurned: Number(data.totalBurned ?? data.total_burned ?? MOCK_TOKENOMICS.totalBurned),
    feeRevenueSol: Number(data.feeRevenueSol ?? data.fee_revenue_sol ?? MOCK_TOKENOMICS.feeRevenueSol),
    lastUpdated: String(data.lastUpdated ?? data.last_updated ?? MOCK_TOKENOMICS.lastUpdated),
    distributionBreakdown: {
      bounties: Number.isFinite(bounties) ? bounties : MOCK_TOKENOMICS.distributionBreakdown.bounties,
      treasury: Number.isFinite(treasury) ? treasury : MOCK_TOKENOMICS.distributionBreakdown.treasury,
      liquidity: Number.isFinite(liquidity) ? liquidity : MOCK_TOKENOMICS.distributionBreakdown.liquidity,
      community: Number.isFinite(community) ? community : MOCK_TOKENOMICS.distributionBreakdown.community,
    },
  };
}

function normalizeTreasury(data: Record<string, unknown>): TreasuryData {
  return {
    solBalance: Number(data.solBalance ?? data.sol_balance ?? MOCK_TREASURY.solBalance),
    fndryBalance: Number(data.fndryBalance ?? data.fndry_balance ?? MOCK_TREASURY.fndryBalance),
    treasuryWallet: String(data.treasuryWallet ?? data.treasury_wallet ?? MOCK_TREASURY.treasuryWallet),
    totalPaidOutFndry: Number(data.totalPaidOutFndry ?? data.total_paid_out_fndry ?? MOCK_TREASURY.totalPaidOutFndry),
    totalPaidOutSol: Number(data.totalPaidOutSol ?? data.total_paid_out_sol ?? MOCK_TREASURY.totalPaidOutSol),
    totalPayouts: Number(data.totalPayouts ?? data.total_payouts ?? MOCK_TREASURY.totalPayouts),
    totalBuybackAmount: Number(data.totalBuybackAmount ?? data.total_buyback_amount ?? MOCK_TREASURY.totalBuybackAmount),
    totalBuybacks: Number(data.totalBuybacks ?? data.total_buybacks ?? MOCK_TREASURY.totalBuybacks),
    lastUpdated: String(data.lastUpdated ?? data.last_updated ?? MOCK_TREASURY.lastUpdated),
  };
}

function MetricCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-forge-900 p-5 shadow-[0_10px_30px_rgba(0,0,0,0.12)]">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs uppercase tracking-[0.2em] text-text-muted">{label}</p>
        <Icon className="h-4 w-4 text-emerald" />
      </div>
      <p className="mt-3 font-sans text-2xl font-semibold text-text-primary">{value}</p>
      {hint && <p className="mt-1 text-xs text-text-muted">{hint}</p>}
    </div>
  );
}

function DistributionFigure({ tokenomics }: { tokenomics: TokenomicsData }) {
  const rows = [
    { key: 'bounties', label: 'Bounties', value: tokenomics.distributionBreakdown.bounties, className: 'bg-emerald' },
    { key: 'treasury', label: 'Treasury', value: tokenomics.distributionBreakdown.treasury, className: 'bg-magenta' },
    { key: 'liquidity', label: 'Liquidity', value: tokenomics.distributionBreakdown.liquidity, className: 'bg-status-info' },
    { key: 'community', label: 'Community', value: tokenomics.distributionBreakdown.community, className: 'bg-tier-t2' },
  ];
  const total = rows.reduce((sum, row) => sum + row.value, 0) || 1;

  return (
    <figure role="figure" aria-label="distribution breakdown" className="rounded-2xl border border-border bg-forge-900 p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Distribution</p>
          <h3 className="mt-1 font-display text-xl font-semibold text-text-primary">FNDRY allocation</h3>
        </div>
        <p className="font-mono text-sm text-text-muted">{formatCompactValue(total)} total</p>
      </div>

      <div className="mt-5 h-4 overflow-hidden rounded-full bg-forge-800 flex">
        {rows.map((row) => (
          <div
            key={row.key}
            className={row.className}
            style={{ width: `${(row.value / total) * 100}%` }}
            title={`${row.label}: ${formatCompactValue(row.value)}`}
          />
        ))}
      </div>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
        {rows.map((row) => {
          const share = ((row.value / total) * 100).toFixed(1);
          return (
            <div key={row.key} className="rounded-xl border border-border bg-forge-950/60 px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${row.className}`} />
                  <span className="text-sm text-text-secondary">{row.label}</span>
                </div>
                <span className="font-mono text-xs text-text-muted">{share}%</span>
              </div>
              <p className="mt-2 font-mono text-sm text-text-primary">{formatCompactValue(row.value)} FNDRY</p>
            </div>
          );
        })}
      </div>
    </figure>
  );
}

function TokenomicsPageContent() {
  const [state, setState] = useState<{
    loading: LoadingState;
    tokenomics: TokenomicsData;
    treasury: TreasuryData;
    error: string | null;
  }>({
    loading: 'loading',
    tokenomics: MOCK_TOKENOMICS,
    treasury: MOCK_TREASURY,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [tokenomicsResponse, treasuryResponse] = await Promise.allSettled([
          fetchJson<Record<string, unknown>>('/api/tokenomics'),
          fetchJson<Record<string, unknown>>('/api/treasury'),
        ]);

        if (cancelled) return;

        const tokenomics = tokenomicsResponse.status === 'fulfilled'
          ? normalizeTokenomics(tokenomicsResponse.value)
          : MOCK_TOKENOMICS;
        const treasury = treasuryResponse.status === 'fulfilled'
          ? normalizeTreasury(treasuryResponse.value)
          : MOCK_TREASURY;

        const error = tokenomicsResponse.status === 'rejected' || treasuryResponse.status === 'rejected'
          ? 'Failed to load treasury data. Showing cached defaults.'
          : null;

        setState({ loading: 'ready', tokenomics, treasury, error });
      } catch (err) {
        if (cancelled) return;
        setState({
          loading: 'ready',
          tokenomics: MOCK_TOKENOMICS,
          treasury: MOCK_TREASURY,
          error: err instanceof Error ? err.message : 'Failed to load treasury data. Showing cached defaults.',
        });
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  const supplyRatio = useMemo(() => {
    const { circulatingSupply, totalSupply } = state.tokenomics;
    return totalSupply > 0 ? (circulatingSupply / totalSupply) * 100 : 0;
  }, [state.tokenomics]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 md:py-14">
      {state.loading === 'loading' && (
        <div role="status" className="rounded-2xl border border-border bg-forge-900 p-6 text-text-muted">
          Loading tokenomics data...
        </div>
      )}

      {state.error && (
        <div role="alert" className="mb-6 rounded-2xl border border-status-error/30 bg-status-error/10 px-4 py-3 text-sm text-status-error">
          {state.error}
        </div>
      )}

      <div className="flex flex-col gap-3">
        <p className="text-xs font-mono uppercase tracking-[0.3em] text-text-muted">Protocol economics</p>
        <h1 className="font-display text-3xl md:text-5xl font-bold text-text-primary tracking-wide">
          FNDRY Tokenomics
        </h1>
        <p className="max-w-3xl text-text-secondary leading-relaxed">
          Live supply metrics, treasury balance, and market data for the SolFoundry ecosystem token.
        </p>
      </div>

      <div className="mt-8 grid grid-cols-1 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.8fr)] gap-6">
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            <MetricCard icon={Coins} label="Total Supply" value={formatCompactValue(state.tokenomics.totalSupply)} hint="Maximum minted FNDRY" />
            <MetricCard icon={Wallet} label="Circulating" value={formatCompactValue(state.tokenomics.circulatingSupply)} hint={`${supplyRatio.toFixed(1)}% of supply`} />
            <MetricCard icon={Landmark} label="Treasury" value={formatCompactValue(state.tokenomics.treasuryHoldings)} hint="Reserved for rewards and ops" />
            <MetricCard icon={ReceiptText} label="Distributed" value={formatCompactValue(state.tokenomics.totalDistributed)} hint="Paid to contributors" />
            <MetricCard icon={PiggyBank} label="Buybacks" value={formatCompactValue(state.tokenomics.totalBuybacks)} hint="On-market repurchases" />
            <MetricCard icon={Flame} label="Total Burned" value={formatCompactValue(state.tokenomics.totalBurned)} hint={`Fees: ${state.tokenomics.feeRevenueSol.toFixed(1)} SOL`} />
          </div>

          <DistributionFigure tokenomics={state.tokenomics} />
        </div>

        <div className="space-y-6">
          <TokenPriceWidget className="sticky top-24" />

          <section className="rounded-2xl border border-border bg-forge-900 p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-text-muted">Contract details</p>
            <div className="mt-4 space-y-4">
              <div>
                <p className="text-sm text-text-muted">Token CA</p>
                <p className="mt-1 font-mono text-sm text-text-primary break-all">{state.tokenomics.tokenCA}</p>
              </div>
              <div>
                <p className="text-sm text-text-muted">Treasury wallet</p>
                <p className="mt-1 font-mono text-sm text-text-primary break-all">{truncateAddress(state.treasury.treasuryWallet, 8)}</p>
              </div>
              <div>
                <p className="text-sm text-text-muted">Treasury balance</p>
                <p className="mt-1 font-mono text-sm text-text-primary">
                  {formatCompactValue(state.treasury.fndryBalance)} FNDRY / {state.treasury.solBalance.toFixed(1)} SOL
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export function TokenomicsPage() {
  return <TokenomicsPageContent />;
}

export { TokenomicsPageContent };
