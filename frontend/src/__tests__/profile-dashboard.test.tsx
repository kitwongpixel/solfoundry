import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    user: {
      id: 'user-1',
      username: 'alice_dev',
      email: 'alice@example.com',
      avatar_url: 'https://example.com/avatar.png',
      wallet_address: 'WalletA',
      created_at: '2026-01-15T00:00:00Z',
    },
  }),
}));

vi.mock('../hooks/useBounties', () => ({
  useBounties: () => ({
    data: {
      items: [
        {
          id: 'bounty-1',
          creator_id: 'user-1',
          title: 'Ship profile dashboard',
          created_at: '2026-03-01T10:00:00Z',
          reward_amount: 1250,
          reward_token: 'FNDRY',
          status: 'open',
          submission_count: 3,
          payout_at: '2026-03-12T12:00:00Z',
          payout_amount: 1250,
          winner_wallet: 'WalletA',
        },
        {
          id: 'bounty-2',
          creator_id: 'user-2',
          title: 'Ignore this one',
          created_at: '2026-03-02T10:00:00Z',
          reward_amount: 500,
          reward_token: 'FNDRY',
          status: 'completed',
          submission_count: 1,
          payout_at: '2026-04-01T12:00:00Z',
          payout_amount: 750,
          winner_wallet: 'walleta',
        },
      ],
    },
    isLoading: false,
  }),
}));

vi.mock('../hooks/useLeaderboard', () => ({
  useLeaderboard: () => ({
    data: [
      {
        rank: 7,
        username: 'alice_dev',
        avatarUrl: 'https://example.com/avatar.png',
        points: 1200,
        bountiesCompleted: 9,
        earningsFndry: 2000,
        earningsSol: 0,
        streak: 11,
        topSkills: ['TypeScript', 'React', 'Solana'],
        reputation: 92.3,
        stakedFndry: 0,
        reputationBoost: 1.1,
      },
    ],
    isLoading: false,
  }),
}));

vi.mock('../hooks/useGitHubActivity', () => ({
  useGitHubActivity: () => ({
    data: {
      username: 'alice_dev',
      totalEvents: 14,
      activeDays: 4,
      streak: 3,
      days: [
        { date: '2026-05-18', count: 0, level: 0 },
        { date: '2026-05-19', count: 1, level: 1 },
        { date: '2026-05-20', count: 2, level: 1 },
        { date: '2026-05-21', count: 3, level: 2 },
        { date: '2026-05-22', count: 8, level: 4 },
        { date: '2026-05-23', count: 0, level: 0 },
      ],
      counts: {
        commits: 8,
        pullRequests: 2,
        issues: 1,
        reviews: 1,
        other: 2,
      },
    },
    isLoading: false,
    error: null,
  }),
}));

vi.stubGlobal('ResizeObserver', class {
  observe() {}
  unobserve() {}
  disconnect() {}
});

import { ProfileDashboard } from '../components/profile/ProfileDashboard';

describe('ProfileDashboard', () => {
  it('renders the contributor profile dashboard sections', () => {
    render(<ProfileDashboard />);

    expect(screen.getByRole('heading', { name: 'alice_dev' })).toBeInTheDocument();
    expect(screen.getByText('Joined Jan 2026 · 1 bounties created')).toBeInTheDocument();
    expect(screen.getByText('TypeScript')).toBeInTheDocument();
    expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.getByText('Solana')).toBeInTheDocument();

    expect(screen.getByText('Total Earned')).toBeInTheDocument();
    expect(screen.getAllByText('2,000 FNDRY')).toHaveLength(2);
    expect(screen.getByText('Bounties Completed')).toBeInTheDocument();
    expect(screen.getByText('9')).toBeInTheDocument();
    expect(screen.getByText('Contribution Streak')).toBeInTheDocument();
    expect(screen.getByText('11d')).toBeInTheDocument();
    expect(screen.getByText('Reputation')).toBeInTheDocument();
    expect(screen.getByText('92.3')).toBeInTheDocument();

    expect(screen.getByLabelText('GitHub activity graph')).toBeInTheDocument();
    expect(screen.getByText('FNDRY payouts over time')).toBeInTheDocument();
    expect(screen.getByText('Ship profile dashboard')).toBeInTheDocument();
    expect(screen.getByText('1,250 FNDRY')).toBeInTheDocument();
  });
});
