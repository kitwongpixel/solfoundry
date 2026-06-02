import React from 'react';
import { motion } from 'framer-motion';
import { Flame, GitPullRequest, Medal, Wallet } from 'lucide-react';
import { fadeIn, staggerItem } from '../../lib/animations';
import { formatCurrency } from '../../lib/utils';
import type { ProfileHighlights } from '../../lib/profile';

interface ProfileStatsRowProps {
  stats: ProfileHighlights;
  loading?: boolean;
}

function StatCard({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <motion.div
      variants={staggerItem}
      className="rounded-xl border border-border bg-forge-900 p-4"
    >
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs uppercase tracking-[0.2em] text-text-muted">{label}</p>
        <div className="text-text-muted">{icon}</div>
      </div>
      <p className="font-mono text-2xl font-semibold text-text-primary">{value}</p>
      {hint ? <p className="mt-1 text-xs text-text-muted">{hint}</p> : null}
    </motion.div>
  );
}

export function ProfileStatsRow({ stats, loading = false }: ProfileStatsRowProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="rounded-xl border border-border bg-forge-900 p-4 animate-pulse"
          >
            <div className="h-3 w-24 rounded bg-forge-800 mb-4" />
            <div className="h-8 w-28 rounded bg-forge-800" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <motion.div
      variants={fadeIn}
      initial="initial"
      animate="animate"
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
    >
      <StatCard
        icon={<Wallet className="w-4 h-4" />}
        label="Total Earned"
        value={formatCurrency(stats.totalEarned, 'FNDRY')}
        hint="FNDRY payouts recorded on the leaderboard"
      />
      <StatCard
        icon={<GitPullRequest className="w-4 h-4" />}
        label="Bounties Completed"
        value={String(stats.bountiesCompleted)}
        hint="Completed submissions and approved work"
      />
      <StatCard
        icon={<Flame className="w-4 h-4" />}
        label="Contribution Streak"
        value={`${stats.streak}d`}
        hint="Consecutive active days from GitHub activity"
      />
      <StatCard
        icon={<Medal className="w-4 h-4" />}
        label="Reputation"
        value={stats.reputation.toFixed(1)}
        hint={stats.rank ? `Rank #${stats.rank}` : 'Leaderboard position unavailable'}
      />
    </motion.div>
  );
}
