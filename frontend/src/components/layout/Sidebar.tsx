import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronLeft, LayoutDashboard, Medal, Sparkles, Wallet } from 'lucide-react';

const NAV_ITEMS = [
  { label: 'Home', to: '/', icon: LayoutDashboard },
  { label: 'Bounties', to: '/bounties', icon: Sparkles },
  { label: 'Leaderboard', to: '/leaderboard', icon: Medal },
  { label: 'Tokenomics', to: '/tokenomics', icon: Wallet },
];

export interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const location = useLocation();

  return (
    <aside className={`hidden md:flex flex-col border-r border-border bg-forge-950 ${collapsed ? 'w-16' : 'w-64'} transition-all duration-200`}>
      <div className="h-16 border-b border-border flex items-center justify-between px-4">
        {!collapsed && <span className="font-display text-sm font-semibold text-text-primary">Navigation</span>}
        <button
          type="button"
          onClick={onToggle}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="inline-flex items-center justify-center rounded-lg border border-border bg-forge-900 p-2 text-text-muted hover:text-text-primary hover:border-border-hover transition-colors"
        >
          <ChevronLeft className={`h-4 w-4 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
        </button>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {NAV_ITEMS.map((item) => {
          const active = location.pathname === item.to || location.pathname.startsWith(`${item.to}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors ${
                active
                  ? 'bg-emerald-bg text-emerald border border-emerald-border'
                  : 'text-text-secondary hover:text-text-primary hover:bg-forge-900'
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
