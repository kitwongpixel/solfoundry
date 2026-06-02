import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { GitPullRequest } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useBounties } from '../../hooks/useBounties';
import { useLeaderboard } from '../../hooks/useLeaderboard';
import { timeAgo, formatCurrency } from '../../lib/utils';
import { fadeIn, staggerContainer, staggerItem } from '../../lib/animations';
import type { Bounty } from '../../types/bounty';
import { buildProfileHighlights } from '../../lib/profile';
import { ProfileStatsRow } from './ProfileStatsRow';
import { GitHubActivityGraph } from './GitHubActivityGraph';
import { EarningsHistoryChart } from './EarningsHistoryChart';

const TABS = ['My Bounties', 'My Submissions', 'Earnings', 'Settings'] as const;
type Tab = typeof TABS[number];

function BountyStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    open: 'text-emerald bg-emerald-bg border-emerald-border',
    funded: 'text-status-info bg-status-info/10 border-status-info/20',
    in_review: 'text-magenta bg-magenta-bg border-magenta-border',
    completed: 'text-text-muted bg-forge-800 border-border',
    cancelled: 'text-status-error bg-status-error/10 border-status-error/20',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${styles[status] ?? styles.open}`}>
      {status}
    </span>
  );
}

function MyBountiesTab({ bounties, loading }: { bounties: Bounty[]; loading: boolean }) {
  if (loading) {
    return <div className="text-text-muted text-sm py-8 text-center">Loading...</div>;
  }
  if (!bounties.length) {
    return (
      <div className="text-center py-12">
        <p className="text-text-muted mb-2">You haven't created any bounties yet.</p>
        <a href="/bounties/create" className="text-sm text-emerald hover:text-emerald-light transition-colors">
          Post your first bounty →
        </a>
      </div>
    );
  }
  return (
    <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-2">
      {bounties.map((b) => (
        <motion.div
          key={b.id}
          variants={staggerItem}
          className="flex items-center gap-4 px-4 py-3 rounded-lg bg-forge-900 border border-border hover:bg-forge-850 transition-colors cursor-pointer"
          onClick={() => window.location.href = `/bounties/${b.id}`}
        >
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-text-primary truncate">{b.title}</p>
            <p className="text-xs text-text-muted mt-0.5">{timeAgo(b.created_at)}</p>
          </div>
          <span className="font-mono text-sm font-semibold text-emerald">{formatCurrency(b.reward_amount, b.reward_token)}</span>
          <BountyStatusBadge status={b.status} />
          <span className="text-xs text-text-muted inline-flex items-center gap-1">
            <GitPullRequest className="w-3.5 h-3.5" /> {b.submission_count}
          </span>
        </motion.div>
      ))}
    </motion.div>
  );
}

function SubmissionsTab() {
  return (
    <div className="text-center py-12">
      <p className="text-text-muted text-sm">No submissions yet.</p>
      <a href="/" className="text-sm text-emerald hover:text-emerald-light transition-colors mt-2 block">
        Browse open bounties →
      </a>
    </div>
  );
}

function SettingsTab() {
  const { user } = useAuth();
  return (
    <div className="space-y-6 max-w-lg">
      <div className="rounded-xl border border-border bg-forge-900 p-5">
        <h3 className="font-sans text-base font-semibold text-text-primary mb-4">GitHub Account</h3>
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-text-muted">Username</span>
            <span className="text-text-primary font-medium">{user?.username}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-text-muted">Email</span>
            <span className="text-text-primary">{user?.email ?? '—'}</span>
          </div>
        </div>
      </div>
      <div className="rounded-xl border border-border bg-forge-900 p-5">
        <h3 className="font-sans text-base font-semibold text-text-primary mb-2">Solana Wallet</h3>
        <p className="text-sm text-text-muted">
          {user?.wallet_address ? (
            <span className="font-mono">{user.wallet_address}</span>
          ) : (
            'No wallet linked. Link a wallet to receive FNDRY payouts.'
          )}
        </p>
      </div>
    </div>
  );
}

export function ProfileDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('My Bounties');
  const { data: bountiesData, isLoading: bountiesLoading } = useBounties({ limit: 200 });
  const { data: leaderboardData, isLoading: leaderboardLoading } = useLeaderboard('all');

  if (!user) return null;

  const joinDate = user.created_at
    ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : 'Recently';

  const myBounties = bountiesData?.items.filter((b) => b.creator_id === user.id) ?? [];
  const leaderboardEntry = leaderboardData?.find((entry) => entry.username.toLowerCase() === user.username.toLowerCase()) ?? null;
  const profileHighlights = buildProfileHighlights(leaderboardEntry);

  return (
    <motion.div variants={fadeIn} initial="initial" animate="animate" className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="rounded-xl border border-border bg-forge-900 p-6 mb-6">
        <div className="flex items-start gap-5">
          {user.avatar_url ? (
            <img src={user.avatar_url} className="w-16 h-16 rounded-full border-2 border-border" alt={user.username} />
          ) : (
            <div className="w-16 h-16 rounded-full bg-forge-700 border-2 border-border flex items-center justify-center">
              <span className="font-display text-2xl text-text-muted">{user.username[0]?.toUpperCase()}</span>
            </div>
          )}
          <div className="flex-1">
            <h1 className="font-sans text-2xl font-semibold text-text-primary">{user.username}</h1>
            <p className="mt-1 font-mono text-sm text-text-muted">
              Joined {joinDate} · {myBounties.length} bounties created
            </p>
            {leaderboardEntry?.topSkills?.length ? (
              <div className="flex flex-wrap gap-2 mt-4">
                {leaderboardEntry.topSkills.slice(0, 4).map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center rounded-full border border-border bg-forge-800 px-2.5 py-1 text-xs text-text-secondary"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-1 p-1 rounded-lg bg-forge-800 mt-6 w-fit">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors duration-150 ${
                activeTab === tab
                  ? 'bg-forge-700 text-text-primary'
                  : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-6 mb-6">
        <ProfileStatsRow stats={profileHighlights} loading={leaderboardLoading} />

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <GitHubActivityGraph username={user.username} />
          <EarningsHistoryChart
            walletAddress={user.wallet_address}
            bounties={bountiesData?.items ?? []}
            fallbackTotal={profileHighlights.totalEarned}
            loading={bountiesLoading}
          />
        </div>
      </div>

      {/* Tab content */}
      <div>
        {activeTab === 'My Bounties' && <MyBountiesTab bounties={myBounties} loading={bountiesLoading} />}
        {activeTab === 'My Submissions' && <SubmissionsTab />}
        {activeTab === 'Earnings' && (
          <div className="rounded-xl border border-border bg-forge-900 p-6">
            <p className="text-sm text-text-secondary mb-4">
              Earnings are summarized above using completed bounty payouts tied to your wallet.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-lg border border-border bg-forge-950 p-4">
                <p className="text-xs text-text-muted mb-1">Wallet</p>
                <p className="font-mono text-sm text-text-primary break-all">
                  {user.wallet_address ?? 'Not linked'}
                </p>
              </div>
              <div className="rounded-lg border border-border bg-forge-950 p-4">
                <p className="text-xs text-text-muted mb-1">FNDRY Earned</p>
                <p className="font-mono text-sm text-emerald">{formatCurrency(profileHighlights.totalEarned, 'FNDRY')}</p>
              </div>
              <div className="rounded-lg border border-border bg-forge-950 p-4">
                <p className="text-xs text-text-muted mb-1">Payout Source</p>
                <p className="font-mono text-sm text-text-primary">Completed bounties</p>
              </div>
            </div>
          </div>
        )}
        {activeTab === 'Settings' && <SettingsTab />}
      </div>
    </motion.div>
  );
}
