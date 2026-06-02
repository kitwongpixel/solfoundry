import { describe, expect, it } from 'vitest';
import { buildEarningsHistory, summarizeGitHubEvents, type GitHubPublicEvent, type ProfileBountySource } from '../lib/profile';

function utcDateKey(offsetDays: number): string {
  const date = new Date();
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCDate(date.getUTCDate() - offsetDays);
  return date.toISOString().slice(0, 10);
}

describe('profile utils', () => {
  it('summarizes GitHub public events across a rolling window', () => {
    const events: GitHubPublicEvent[] = [
      { type: 'PushEvent', created_at: `${utcDateKey(0)}T09:00:00Z`, payload: { size: 3 } },
      { type: 'PullRequestEvent', created_at: `${utcDateKey(0)}T11:00:00Z` },
      { type: 'IssuesEvent', created_at: `${utcDateKey(1)}T12:00:00Z` },
      { type: 'PullRequestReviewEvent', created_at: `${utcDateKey(2)}T08:00:00Z` },
      { type: 'PushEvent', created_at: `${utcDateKey(4)}T08:00:00Z`, payload: { size: 5 } },
    ];

    const summary = summarizeGitHubEvents('alice', events, 1);

    expect(summary.username).toBe('alice');
    expect(summary.totalEvents).toBe(5);
    expect(summary.activeDays).toBe(2);
    expect(summary.streak).toBe(2);
    expect(summary.counts).toEqual({
      commits: 3,
      pullRequests: 1,
      issues: 1,
      reviews: 0,
      other: 0,
    });
    expect(summary.days.at(-1)?.count).toBe(4);
  });

  it('groups FNDRY payouts by month for the linked wallet only', () => {
    const bounties: ProfileBountySource[] = [
      {
        reward_amount: 1200,
        reward_token: 'FNDRY',
        winner_wallet: 'WalletA',
        payout_at: '2026-01-10T12:00:00Z',
        payout_amount: 1500,
      },
      {
        reward_amount: 800,
        reward_token: 'FNDRY',
        winner_wallet: 'walleta',
        payout_at: '2026-01-21T12:00:00Z',
      },
      {
        reward_amount: 400,
        reward_token: 'USDC',
        winner_wallet: 'WalletA',
        payout_at: '2026-02-01T12:00:00Z',
      },
      {
        reward_amount: 500,
        reward_token: 'FNDRY',
        winner_wallet: 'WalletB',
        payout_at: '2026-02-05T12:00:00Z',
      },
      {
        reward_amount: 600,
        reward_token: 'FNDRY',
        winner_wallet: 'WalletA',
        payout_at: '2026-02-05T12:00:00Z',
      },
    ];

    const history = buildEarningsHistory(bounties, 'walleta');

    expect(history).toHaveLength(2);
    expect(history[0]).toEqual({
      month: new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' }).format(
        new Date('2026-01-01T00:00:00Z'),
      ),
      amount: 2300,
      payouts: 2,
    });
    expect(history[1]).toEqual({
      month: new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' }).format(
        new Date('2026-02-01T00:00:00Z'),
      ),
      amount: 600,
      payouts: 1,
    });
  });
});
