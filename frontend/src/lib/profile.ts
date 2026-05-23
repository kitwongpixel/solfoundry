import type { Bounty } from '../types/bounty';
import type { LeaderboardEntry } from '../types/leaderboard';

export interface GitHubPublicEvent {
  type: string;
  created_at: string;
  payload?: {
    size?: number;
    [key: string]: unknown;
  };
}

export interface GitHubActivityDay {
  date: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
}

export interface GitHubActivitySummary {
  username: string;
  totalEvents: number;
  activeDays: number;
  streak: number;
  days: GitHubActivityDay[];
  counts: {
    commits: number;
    pullRequests: number;
    issues: number;
    reviews: number;
    other: number;
  };
}

export interface EarningsPoint {
  month: string;
  amount: number;
  payouts: number;
}

export interface ProfileHighlights {
  totalEarned: number;
  bountiesCompleted: number;
  streak: number;
  reputation: number;
  rank: number | null;
  topSkills: string[];
}

export type ProfileBountySource = Pick<Bounty, 'reward_amount' | 'reward_token'> & {
  winner_wallet?: string | null;
  payout_at?: string | null;
  payout_amount?: number | null;
};

function toUtcDateKey(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseUtcDateKey(dateKey: string): Date {
  return new Date(`${dateKey}T00:00:00Z`);
}

function getActivityLevel(count: number): 0 | 1 | 2 | 3 | 4 {
  if (count <= 0) return 0;
  if (count <= 2) return 1;
  if (count <= 4) return 2;
  if (count <= 6) return 3;
  return 4;
}

function formatMonthKey(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

export function summarizeGitHubEvents(
  username: string,
  events: GitHubPublicEvent[],
  windowDays = 90,
): GitHubActivitySummary {
  const end = new Date();
  end.setUTCHours(0, 0, 0, 0);

  const countsByDay = new Map<string, number>();
  let commits = 0;
  let pullRequests = 0;
  let issues = 0;
  let reviews = 0;
  let other = 0;

  for (const event of events) {
    if (!event.created_at) continue;
    const date = new Date(event.created_at);
    if (Number.isNaN(date.getTime())) continue;
    date.setUTCHours(0, 0, 0, 0);
    if (date < new Date(end.getTime() - windowDays * 24 * 60 * 60 * 1000)) continue;

    const key = toUtcDateKey(date);
    const current = countsByDay.get(key) ?? 0;

    let increment = 1;
    switch (event.type) {
      case 'PushEvent': {
        const size = typeof event.payload?.size === 'number' && event.payload.size > 0 ? event.payload.size : 1;
        increment = size;
        commits += size;
        break;
      }
      case 'PullRequestEvent':
        pullRequests += 1;
        break;
      case 'IssuesEvent':
        issues += 1;
        break;
      case 'PullRequestReviewEvent':
        reviews += 1;
        break;
      default:
        other += 1;
        break;
    }

    countsByDay.set(key, current + increment);
  }

  const days: GitHubActivityDay[] = [];
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - windowDays);

  for (let cursor = new Date(start); cursor <= end; cursor.setUTCDate(cursor.getUTCDate() + 1)) {
    const key = toUtcDateKey(cursor);
    const count = countsByDay.get(key) ?? 0;
    days.push({
      date: key,
      count,
      level: getActivityLevel(count),
    });
  }

  const activeDays = days.filter((day) => day.count > 0).length;
  let streak = 0;
  for (let i = days.length - 1; i >= 0; i -= 1) {
    if (days[i]?.count && days[i].count > 0) {
      streak += 1;
      continue;
    }
    break;
  }

  return {
    username,
    totalEvents: days.reduce((sum, day) => sum + day.count, 0),
    activeDays,
    streak,
    days,
    counts: { commits, pullRequests, issues, reviews, other },
  };
}

export function buildEarningsHistory(
  bounties: ProfileBountySource[],
  walletAddress?: string | null,
): EarningsPoint[] {
  if (!walletAddress) return [];

  const normalizedWallet = walletAddress.toLowerCase();
  const byMonth = new Map<string, EarningsPoint>();

  for (const bounty of bounties) {
    if (bounty.reward_token !== 'FNDRY') continue;
    if (!bounty.payout_at || !bounty.winner_wallet) continue;
    if (bounty.winner_wallet.toLowerCase() !== normalizedWallet) continue;

    const payoutDate = new Date(bounty.payout_at);
    if (Number.isNaN(payoutDate.getTime())) continue;

    const month = formatMonthKey(payoutDate);
    const amount = bounty.payout_amount ?? bounty.reward_amount;
    const existing = byMonth.get(month);

    if (existing) {
      existing.amount += amount;
      existing.payouts += 1;
    } else {
      byMonth.set(month, { month, amount, payouts: 1 });
    }
  }

  return [...byMonth.values()]
    .sort((a, b) => parseUtcDateKey(`${a.month}-01`).getTime() - parseUtcDateKey(`${b.month}-01`).getTime())
    .map((point) => ({
      ...point,
      month: new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' }).format(
        parseUtcDateKey(`${point.month}-01`),
      ),
    }));
}

export function buildProfileHighlights(entry: LeaderboardEntry | null | undefined): ProfileHighlights {
  return {
    totalEarned: entry?.earningsFndry ?? 0,
    bountiesCompleted: entry?.bountiesCompleted ?? 0,
    streak: entry?.streak ?? 0,
    reputation: entry?.reputation ?? 0,
    rank: entry?.rank ?? null,
    topSkills: entry?.topSkills ?? [],
  };
}
