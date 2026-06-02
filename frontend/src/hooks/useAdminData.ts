import { useQuery } from '@tanstack/react-query';
import type { TreasuryData } from '../types/tokenomics';
export interface TreasurySpendingTier {
  tier: number;
  label: string;
  total_fndry: number;
  count: number;
}

export interface TreasuryTransaction {
  id: string;
  type: 'payout' | 'buyback' | 'refund' | 'other';
  amount: number;
  token: 'FNDRY' | 'SOL' | 'USDC' | string;
  recipient: string | null;
  description: string;
  tx_hash: string | null;
  solscan_url: string | null;
  status: 'confirmed' | 'pending' | 'failed' | string;
  created_at: string;
}

export interface TreasuryDayPoint {
  date: string;
  outflow: number;
  inflow: number;
}

export interface BurnRateSummary {
  daily_avg_7d: number;
  daily_avg_30d: number;
  daily_avg_90d: number;
  runway_days_7d: number;
  runway_days_30d: number;
}

export interface TreasuryDashboard extends TreasuryData {
  totalPaidOutFndry: number;
  totalPaidOutSol: number;
  totalPayouts: number;
  totalBuybackAmount: number;
  totalBuybacks: number;
  treasuryWallet: string;
  solBalance: number;
  fndryBalance: number;
  dailyPoints: TreasuryDayPoint[];
  burnRate: BurnRateSummary;
  spendingByTier: TreasurySpendingTier[];
  recentTransactions: TreasuryTransaction[];
}

function toCamelCaseDashboard(data: Record<string, unknown>): TreasuryDashboard {
  return {
    solBalance: Number(data.solBalance ?? data.sol_balance ?? 0),
    fndryBalance: Number(data.fndryBalance ?? data.fndry_balance ?? 0),
    treasuryWallet: String(data.treasuryWallet ?? data.treasury_wallet ?? ''),
    totalPaidOutFndry: Number(data.totalPaidOutFndry ?? data.total_paid_out_fndry ?? 0),
    totalPaidOutSol: Number(data.totalPaidOutSol ?? data.total_paid_out_sol ?? 0),
    totalPayouts: Number(data.totalPayouts ?? data.total_payouts ?? 0),
    totalBuybackAmount: Number(data.totalBuybackAmount ?? data.total_buyback_amount ?? 0),
    totalBuybacks: Number(data.totalBuybacks ?? data.total_buybacks ?? 0),
    lastUpdated: String(data.lastUpdated ?? data.last_updated ?? new Date().toISOString()),
    dailyPoints: ((data.dailyPoints ?? data.daily_points ?? []) as Record<string, unknown>[]).map((point) => ({
      date: String(point.date ?? ''),
      outflow: Number(point.outflow ?? 0),
      inflow: Number(point.inflow ?? 0),
    })),
    burnRate: {
      daily_avg_7d: Number((data.burnRate as Record<string, unknown> | undefined)?.daily_avg_7d ?? 0),
      daily_avg_30d: Number((data.burnRate as Record<string, unknown> | undefined)?.daily_avg_30d ?? 0),
      daily_avg_90d: Number((data.burnRate as Record<string, unknown> | undefined)?.daily_avg_90d ?? 0),
      runway_days_7d: Number((data.burnRate as Record<string, unknown> | undefined)?.runway_days_7d ?? 0),
      runway_days_30d: Number((data.burnRate as Record<string, unknown> | undefined)?.runway_days_30d ?? 0),
    },
    spendingByTier: ((data.spendingByTier ?? data.spending_by_tier ?? []) as Record<string, unknown>[]).map((tier) => ({
      tier: Number(tier.tier ?? 0),
      label: String(tier.label ?? `T${tier.tier ?? 0}`),
      total_fndry: Number(tier.total_fndry ?? 0),
      count: Number(tier.count ?? 0),
    })),
    recentTransactions: ((data.recentTransactions ?? data.recent_transactions ?? []) as Record<string, unknown>[]).map((tx) => ({
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

export function getAdminToken(): string {
  try {
    return localStorage.getItem('admin_token') ?? '';
  } catch {
    return '';
  }
}

export async function adminFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getAdminToken();
  const response = await fetch(path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers ?? {}),
    },
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(body || response.statusText || 'Request failed');
  }

  return response.json() as Promise<T>;
}

async function fetchTreasuryDashboard(): Promise<TreasuryDashboard> {
  const data = await adminFetch<Record<string, unknown>>('/api/admin/treasury/dashboard');
  return toCamelCaseDashboard(data);
}

export function useTreasuryDashboard() {
  return useQuery({
    queryKey: ['admin', 'treasury-dashboard'],
    queryFn: fetchTreasuryDashboard,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}
