import React from 'react';
import { motion } from 'framer-motion';
import { GitBranch, GitCommit, Loader2, MessageSquare, Users } from 'lucide-react';
import { fadeIn } from '../../lib/animations';
import { useGitHubActivity } from '../../hooks/useGitHubActivity';

interface GitHubActivityGraphProps {
  username: string;
}

const LEVEL_STYLES = [
  'bg-forge-800 border-border',
  'bg-emerald/30 border-emerald/20',
  'bg-emerald/50 border-emerald/30',
  'bg-emerald/70 border-emerald/40',
  'bg-emerald border-emerald/60',
];

const TYPE_META = [
  { label: 'Commits', value: 'commits', icon: GitBranch },
  { label: 'PRs', value: 'pullRequests', icon: Users },
  { label: 'Issues', value: 'issues', icon: MessageSquare },
  { label: 'Reviews', value: 'reviews', icon: GitCommit },
] as const;

function ActivityLegend() {
  return (
    <div className="flex items-center gap-2 text-xs text-text-muted flex-wrap">
      <span>Less</span>
      {LEVEL_STYLES.map((style, index) => (
        <span
          key={index}
          className={`inline-block h-3 w-3 rounded-[3px] border ${style}`}
          aria-hidden="true"
        />
      ))}
      <span>More</span>
    </div>
  );
}

export function GitHubActivityGraph({ username }: GitHubActivityGraphProps) {
  const { data, isLoading, error } = useGitHubActivity(username);

  return (
    <motion.section
      variants={fadeIn}
      initial="initial"
      animate="animate"
      className="rounded-xl border border-border bg-forge-900 p-5"
      aria-label="GitHub activity graph"
    >
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-text-muted mb-1">GitHub activity</p>
          <h2 className="font-sans text-lg font-semibold text-text-primary">@{username}</h2>
        </div>
        <ActivityLegend />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center min-h-[180px] text-text-muted">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
          Loading GitHub activity...
        </div>
      ) : error ? (
        <div className="rounded-lg border border-status-error/30 bg-status-error/10 px-4 py-3 text-sm text-status-error">
          GitHub activity is temporarily unavailable.
        </div>
      ) : !data || data.totalEvents === 0 ? (
        <div className="rounded-lg border border-border bg-forge-950 px-4 py-6 text-sm text-text-muted">
          No public GitHub activity found for this account in the last 90 days.
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {TYPE_META.map((meta) => {
              const Icon = meta.icon;
              const count = data.counts[meta.value];
              return (
                <div key={meta.label} className="rounded-lg border border-border bg-forge-950 p-3">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs text-text-muted">{meta.label}</span>
                    <Icon className="w-3.5 h-3.5 text-emerald" />
                  </div>
                  <p className="font-mono text-lg font-semibold text-text-primary">{count}</p>
                </div>
              );
            })}
          </div>

          <div className="overflow-x-auto pb-1">
            <div
              className="grid grid-flow-col grid-rows-7 gap-1 min-w-max"
              style={{ gridAutoColumns: '0.95rem' }}
            >
              {data.days.map((day) => (
                <span
                  key={day.date}
                  title={`${day.date}: ${day.count} contribution${day.count === 1 ? '' : 's'}`}
                  className={`h-3 w-3 rounded-[3px] border transition-transform duration-150 hover:scale-125 ${LEVEL_STYLES[day.level]}`}
                />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 text-sm">
            <div className="rounded-lg border border-border bg-forge-950 p-3">
              <p className="text-text-muted text-xs mb-1">Active days</p>
              <p className="font-mono text-text-primary text-base">{data.activeDays}</p>
            </div>
            <div className="rounded-lg border border-border bg-forge-950 p-3">
              <p className="text-text-muted text-xs mb-1">Current streak</p>
              <p className="font-mono text-text-primary text-base">{data.streak} days</p>
            </div>
            <div className="rounded-lg border border-border bg-forge-950 p-3">
              <p className="text-text-muted text-xs mb-1">Total activity</p>
              <p className="font-mono text-text-primary text-base">{data.totalEvents}</p>
            </div>
          </div>
        </div>
      )}
    </motion.section>
  );
}
